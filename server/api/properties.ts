import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { properties, maintenanceRequests, propertyTenants } from '@shared/schema';
import { eq, and, desc, asc, ilike, inArray } from 'drizzle-orm';

const router = Router();

// Get all properties with optional filtering
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      type, 
      status, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      bathrooms,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = req.query;

    let query = db.select().from(properties);

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        ilike(properties.title, `%${search}%`)
      );
    }
    
    if (type && type !== 'all') {
      conditions.push(eq(properties.type, type as string));
    }
    
    if (status && status !== 'all') {
      conditions.push(eq(properties.status, status as string));
    }
    
    if (minPrice) {
      conditions.push(eq(properties.price, parseInt(minPrice as string)));
    }
    
    if (maxPrice) {
      conditions.push(eq(properties.price, parseInt(maxPrice as string)));
    }
    
    if (bedrooms && bedrooms !== 'all') {
      conditions.push(eq(properties.bedrooms, parseInt(bedrooms as string)));
    }
    
    if (bathrooms && bathrooms !== 'all') {
      conditions.push(eq(properties.bathrooms, parseInt(bathrooms as string)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderBy = sortOrder === 'desc' ? desc : asc;
    const sortColumn = sortBy === 'price' ? properties.price : 
                      sortBy === 'bedrooms' ? properties.bedrooms :
                      sortBy === 'title' ? properties.title : 
                      properties.createdAt;
    
    query = query.orderBy(orderBy(sortColumn));

    // Apply pagination
    query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string));

    const results = await query;
    
    res.json({
      success: true,
      data: results,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: results.length
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties'
    });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, parseInt(id)));
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property'
    });
  }
});

// Create new property
const createPropertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  location: z.string().min(1, 'Location is required'),
  bedrooms: z.number().min(0, 'Bedrooms must be non-negative'),
  bathrooms: z.number().min(0, 'Bathrooms must be non-negative'),
  parking: z.number().min(0, 'Parking must be non-negative'),
  size: z.number().min(0, 'Size must be positive'),
  type: z.enum(['apartment', 'house', 'condo', 'studio']),
  status: z.enum(['available', 'occupied', 'maintenance']).default('available'),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  landlordId: z.number().optional(),
  virtualTourUrl: z.string().optional(),
});

router.post('/', async (req, res) => {
  try {
    const validatedData = createPropertySchema.parse(req.body);
    
    const [newProperty] = await db
      .insert(properties)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json({
      success: true,
      data: newProperty
    });
  } catch (error) {
    console.error('Error creating property:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create property'
    });
  }
});

// Update property
const updatePropertySchema = createPropertySchema.partial();

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updatePropertySchema.parse(req.body);
    
    const [updatedProperty] = await db
      .update(properties)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(properties.id, parseInt(id)))
      .returning();
    
    if (!updatedProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedProperty
    });
  } catch (error) {
    console.error('Error updating property:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update property'
    });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deletedProperty] = await db
      .delete(properties)
      .where(eq(properties.id, parseInt(id)))
      .returning();
    
    if (!deletedProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete property'
    });
  }
});

// Get property statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await db
      .select({
        total: db.fn.count(properties.id),
        available: db.fn.count(properties.id).where(eq(properties.status, 'available')),
        occupied: db.fn.count(properties.id).where(eq(properties.status, 'occupied')),
        maintenance: db.fn.count(properties.id).where(eq(properties.status, 'maintenance')),
        avgPrice: db.fn.avg(properties.price)
      })
      .from(properties);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error fetching property stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property statistics'
    });
  }
});

// Get maintenance requests for a property
router.get('/:id/maintenance', async (req, res) => {
  try {
    const { id } = req.params;
    
    const requests = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.propertyId, parseInt(id)))
      .orderBy(desc(maintenanceRequests.createdAt));
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance requests'
    });
  }
});

// Get tenants for a property
router.get('/:id/tenants', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenants = await db
      .select()
      .from(propertyTenants)
      .where(eq(propertyTenants.propertyId, parseInt(id)));
    
    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Error fetching property tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property tenants'
    });
  }
});

export default router;