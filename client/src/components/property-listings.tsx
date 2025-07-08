import { useState } from 'react';
import PropertyCard from './property-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Filter,
  Home,
  MapPin
} from 'lucide-react';

// Mock data for demonstration
const mockProperties = [
  {
    id: '1',
    title: 'Modern 2 Bed Apartment',
    address: 'Canary Wharf, London E14',
    price: 2500,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 850,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    type: 'rent' as const,
    featured: true
  },
  {
    id: '2',
    title: 'Luxury Penthouse Suite',
    address: 'Chelsea, London SW3',
    price: 4500,
    bedrooms: 3,
    bathrooms: 3,
    sqft: 1500,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    type: 'rent' as const,
    featured: true
  },
  {
    id: '3',
    title: 'Cozy Studio Flat',
    address: 'Shoreditch, London E1',
    price: 1800,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 450,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    type: 'rent' as const
  },
  {
    id: '4',
    title: 'Family Home with Garden',
    address: 'Richmond, London TW9',
    price: 750000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2200,
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    type: 'sale' as const
  },
  {
    id: '5',
    title: 'Victorian Conversion',
    address: 'Hampstead, London NW3',
    price: 3200,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
    type: 'rent' as const
  },
  {
    id: '6',
    title: 'New Build Apartment',
    address: 'Kings Cross, London N1',
    price: 2800,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 780,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    type: 'rent' as const
  }
];

export default function PropertyListings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [bedroomFilter, setBedroomFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredProperties = mockProperties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = propertyType === 'all' || property.type === propertyType;
    const matchesBedrooms = bedroomFilter === 'all' || property.bedrooms.toString() === bedroomFilter;
    const matchesPrice = property.type === 'rent' 
      ? property.price >= priceRange[0] && property.price <= priceRange[1]
      : true; // For sales, we'd need a different price range
    
    return matchesSearch && matchesType && matchesBedrooms && matchesPrice;
  });

  return (
    <section id="properties" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Available Properties</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Find your perfect home with our AI-powered search
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by location or property name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Property Type</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                      <SelectItem value="sale">For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                  <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">
                    Monthly Rent: £{priceRange[0]} - £{priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={5000}
                    step={100}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Property Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No properties found matching your criteria.</p>
            <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(property => (
              <PropertyCard
                key={property.id}
                {...property}
                onViewDetails={() => console.log('View details:', property.id)}
                onScheduleViewing={() => console.log('Schedule viewing:', property.id)}
              />
            ))}
          </div>
        )}

        {/* AI Assistant CTA */}
        <div className="mt-12 bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h3>
          <p className="mb-6">Our AI assistant can help you find the perfect property based on your specific needs.</p>
          <Button size="lg" variant="secondary" className="bg-white text-teal-600 hover:bg-gray-100">
            Chat with AI Assistant
          </Button>
        </div>
      </div>
    </section>
  );
}