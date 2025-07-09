import { Router } from 'express';
import { db } from '../db';
import { properties, maintenanceRequests, propertyTenants, users } from '@shared/schema';

const router = Router();

// Seed properties data
router.post('/seed', async (req, res) => {
  try {
    // Clear existing data
    await db.delete(maintenanceRequests);
    await db.delete(propertyTenants);
    await db.delete(properties);

    // Sample property data
    const sampleProperties = [
      {
        title: 'Modern Downtown Apartment',
        description: 'Beautiful modern apartment in the heart of downtown with stunning city views and premium amenities.',
        price: 2500,
        location: 'Downtown District, Metro City',
        bedrooms: 2,
        bathrooms: 2,
        parking: 1,
        size: 1200,
        type: 'apartment' as const,
        status: 'available' as const,
        features: ['Air Conditioning', 'Balcony', 'Gym Access', 'Concierge', 'In-unit Laundry', 'Dishwasher'],
        images: [
          '/api/placeholder/600/400',
          '/api/placeholder/600/400',
          '/api/placeholder/600/400',
          '/api/placeholder/600/400'
        ],
        virtualTourUrl: 'https://example.com/virtual-tour/downtown-apt',
        landlordId: 1,
        rating: 5,
      },
      {
        title: 'Cozy Suburban House',
        description: 'Charming 3-bedroom house with a beautiful garden in a quiet, family-friendly neighborhood.',
        price: 3200,
        location: 'Maple Heights, Suburban Area',
        bedrooms: 3,
        bathrooms: 2,
        parking: 2,
        size: 1800,
        type: 'house' as const,
        status: 'available' as const,
        features: ['Garden', 'Garage', 'Fireplace', 'Pet Friendly', 'Hardwood Floors', 'Updated Kitchen'],
        images: [
          '/api/placeholder/600/400',
          '/api/placeholder/600/400',
          '/api/placeholder/600/400'
        ],
        virtualTourUrl: 'https://example.com/virtual-tour/suburban-house',
        landlordId: 1,
        rating: 5,
      },
      {
        title: 'Luxury Penthouse',
        description: 'Stunning penthouse with panoramic city views and luxury amenities including rooftop access.',
        price: 5500,
        location: 'Skyline Tower, Premium District',
        bedrooms: 3,
        bathrooms: 3,
        parking: 2,
        size: 2200,
        type: 'condo' as const,
        status: 'available' as const,
        features: ['Rooftop Access', 'Smart Home', 'Spa', 'Valet Service', 'Wine Cellar', 'Floor-to-Ceiling Windows'],
        images: [
          '/api/placeholder/600/400',
          '/api/placeholder/600/400',
          '/api/placeholder/600/400',
          '/api/placeholder/600/400',
          '/api/placeholder/600/400'
        ],
        virtualTourUrl: 'https://example.com/virtual-tour/luxury-penthouse',
        landlordId: 1,
        rating: 5,
      },
      {
        title: 'Studio Loft in Arts District',
        description: 'Contemporary studio loft perfect for creative professionals in the vibrant arts district.',
        price: 1800,
        location: 'Arts District, Creative Quarter',
        bedrooms: 1,
        bathrooms: 1,
        parking: 1,
        size: 800,
        type: 'studio' as const,
        status: 'occupied' as const,
        features: ['High Ceilings', 'Exposed Brick', 'Artist Space', 'Natural Light', 'Hardwood Floors'],
        images: [
          '/api/placeholder/600/400',
          '/api/placeholder/600/400'
        ],
        virtualTourUrl: 'https://example.com/virtual-tour/studio-loft',
        landlordId: 1,
        rating: 4,
      },
      {
        title: 'Waterfront Condo',
        description: 'Elegant waterfront condominium with marina views and access to exclusive amenities.',
        price: 4200,
        location: 'Marina Bay, Waterfront District',
        bedrooms: 2,
        bathrooms: 2,
        parking: 1,
        size: 1500,
        type: 'condo' as const,
        status: 'available' as const,
        features: ['Marina Views', 'Pool', 'Fitness Center', 'Concierge', 'Boat Slip Access', 'Security System'],
        images: [
          '/api/placeholder/600/400',
          '/api/placeholder/600/400',
          '/api/placeholder/600/400'
        ],
        virtualTourUrl: 'https://example.com/virtual-tour/waterfront-condo',
        landlordId: 1,
        rating: 5,
      },
      {
        title: 'Family Home with Yard',
        description: 'Spacious family home with large backyard, perfect for children and pets.',
        price: 2800,
        location: 'Riverside Estates, Family Community',
        bedrooms: 4,
        bathrooms: 3,
        parking: 2,
        size: 2000,
        type: 'house' as const,
        status: 'maintenance' as const,
        features: ['Large Yard', 'Playground', 'BBQ Area', 'Storage Shed', 'Family Room', 'Modern Kitchen'],
        images: [
          '/api/placeholder/600/400',
          '/api/placeholder/600/400',
          '/api/placeholder/600/400'
        ],
        virtualTourUrl: 'https://example.com/virtual-tour/family-home',
        landlordId: 1,
        rating: 4,
      }
    ];

    // Insert properties
    const createdProperties = await db.insert(properties).values(sampleProperties).returning();
    
    // Sample maintenance requests
    const sampleMaintenance = [
      {
        propertyId: createdProperties[0].id,
        tenantId: 1,
        title: 'Leaky Faucet in Kitchen',
        description: 'Kitchen faucet has been dripping for 3 days, needs repair',
        category: 'Plumbing',
        priority: 'medium' as const,
        status: 'in-progress' as const,
        assignedTo: 'John Plumber',
        estimatedCost: 15000, // $150.00
        images: ['/api/placeholder/400/300'],
        notes: ['Initial assessment completed', 'Parts ordered'],
      },
      {
        propertyId: createdProperties[1].id,
        tenantId: 1,
        title: 'Air Conditioning Not Working',
        description: 'AC unit not cooling properly in living room, urgent repair needed',
        category: 'HVAC',
        priority: 'high' as const,
        status: 'pending' as const,
        estimatedCost: 35000, // $350.00
        images: ['/api/placeholder/400/300'],
        notes: ['Tenant reported issue via app'],
      },
      {
        propertyId: createdProperties[2].id,
        tenantId: 1,
        title: 'Light Bulb Replacement',
        description: 'Hallway light bulb needs replacement, standard maintenance',
        category: 'Electrical',
        priority: 'low' as const,
        status: 'completed' as const,
        assignedTo: 'Mike Electric',
        estimatedCost: 2500, // $25.00
        actualCost: 2000, // $20.00
        images: [],
        notes: ['Completed during routine maintenance'],
      },
      {
        propertyId: createdProperties[3].id,
        tenantId: 1,
        title: 'Washing Machine Repair',
        description: 'Washing machine making loud noise during spin cycle',
        category: 'Appliances',
        priority: 'medium' as const,
        status: 'in-progress' as const,
        assignedTo: 'Sarah Appliance Repair',
        estimatedCost: 20000, // $200.00
        images: ['/api/placeholder/400/300'],
        notes: ['Diagnostic completed', 'Waiting for replacement parts'],
      },
      {
        propertyId: createdProperties[4].id,
        tenantId: 1,
        title: 'Balcony Door Lock Stuck',
        description: 'Balcony sliding door lock is stuck, security concern',
        category: 'Security',
        priority: 'urgent' as const,
        status: 'pending' as const,
        estimatedCost: 12000, // $120.00
        images: ['/api/placeholder/400/300'],
        notes: ['Urgent security issue reported'],
      }
    ];

    // Insert maintenance requests
    const createdMaintenance = await db.insert(maintenanceRequests).values(sampleMaintenance).returning();

    // Sample tenant data
    const sampleTenants = [
      {
        propertyId: createdProperties[3].id, // Studio Loft (occupied)
        tenantId: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        monthlyRent: 1800,
        depositAmount: 3600,
        leaseTerms: '12-month lease agreement with option to renew',
        status: 'active' as const,
        emergencyContact: {
          name: 'Jane Smith',
          relationship: 'Sister',
          phone: '555-0123',
          email: 'jane.smith@example.com'
        },
      }
    ];

    // Insert tenants
    const createdTenants = await db.insert(propertyTenants).values(sampleTenants).returning();

    res.json({
      success: true,
      data: {
        properties: createdProperties.length,
        maintenance: createdMaintenance.length,
        tenants: createdTenants.length
      },
      message: 'Sample data seeded successfully'
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed data'
    });
  }
});

// Get seeded data summary
router.get('/summary', async (req, res) => {
  try {
    const propertiesCount = await db.select({ count: db.fn.count(properties.id) }).from(properties);
    const maintenanceCount = await db.select({ count: db.fn.count(maintenanceRequests.id) }).from(maintenanceRequests);
    const tenantsCount = await db.select({ count: db.fn.count(propertyTenants.id) }).from(propertyTenants);
    
    res.json({
      success: true,
      data: {
        properties: propertiesCount[0].count,
        maintenance: maintenanceCount[0].count,
        tenants: tenantsCount[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary'
    });
  }
});

export default router;