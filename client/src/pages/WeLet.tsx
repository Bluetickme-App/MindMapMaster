import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Home, 
  Search, 
  MapPin, 
  Bath, 
  Bed, 
  Car, 
  Star, 
  Calendar, 
  DollarSign, 
  Phone,
  Mail,
  MessageCircle,
  Settings,
  User,
  Building,
  Wrench,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Camera,
  PlayCircle,
  Heart,
  Share2,
  Filter,
  SortAsc,
  Grid,
  List,
  Eye,
  Plus,
  Bell,
  ChevronRight,
  X
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  size: number;
  image: string;
  type: 'apartment' | 'house' | 'condo' | 'studio';
  status: 'available' | 'occupied' | 'maintenance';
  features: string[];
  rating: number;
  description: string;
  virtualTour?: string;
  galleryImages: string[];
  landlord: {
    name: string;
    rating: number;
    responseTime: string;
  };
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  category: string;
  dateCreated: string;
  estimatedCompletion?: string;
  assignedTo?: string;
  property: string;
}

const WeLet = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: 'all',
    bedrooms: 'all',
    status: 'all'
  });
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'ai', content: string, timestamp: string}>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  // Fetch properties from API
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties'],
    select: (data) => data.data || []
  });

  // Fetch maintenance requests from API
  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['/api/properties/1/maintenance'],
    select: (data) => data.data || []
  });

  // Transform API data to component format
  useEffect(() => {
    if (propertiesData) {
      const transformedProperties = propertiesData.map((property: any) => ({
        id: property.id.toString(),
        title: property.title,
        price: property.price,
        location: property.location,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking: property.parking,
        size: property.size,
        image: property.images[0] || '/api/placeholder/400/300',
        type: property.type,
        status: property.status,
        features: property.features || [],
        rating: property.rating || 4.5, // Already in 0-5 scale
        description: property.description || '',
        virtualTour: property.virtualTourUrl || '',
        galleryImages: property.images || [],
        landlord: {
          name: 'Property Manager',
          rating: property.rating || 4.5,
          responseTime: '< 2 hours'
        }
      }));
      setProperties(transformedProperties);
    }
  }, [propertiesData]);

  useEffect(() => {
    if (maintenanceData) {
      const transformedMaintenance = maintenanceData.map((request: any) => ({
        id: request.id.toString(),
        title: request.title,
        description: request.description,
        priority: request.priority,
        status: request.status,
        category: request.category,
        dateCreated: new Date(request.dateCreated).toLocaleDateString(),
        estimatedCompletion: request.estimatedCompletion ? new Date(request.estimatedCompletion).toLocaleDateString() : undefined,
        assignedTo: request.assignedTo,
        property: `Property ${request.propertyId}`
      }));
      setMaintenanceRequests(transformedMaintenance);
    }
  }, [maintenanceData]);

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filters.type === 'all' || property.type === filters.type;
    const matchesStatus = filters.status === 'all' || property.status === filters.status;
    const matchesBedrooms = filters.bedrooms === 'all' || property.bedrooms.toString() === filters.bedrooms;
    
    return matchesSearch && matchesType && matchesStatus && matchesBedrooms;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: 'I understand your concern. Let me help you with that. I can assist with maintenance requests, property information, or connect you with your landlord.',
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-800">
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={property.image} 
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <Badge variant={property.status === 'available' ? 'default' : 'secondary'}>
            {property.status}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <Button size="icon" variant="secondary" className="h-8 w-8">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-3 right-3">
          <Button size="sm" variant="secondary" onClick={() => setShowVirtualTour(true)}>
            <PlayCircle className="h-4 w-4 mr-1" />
            Virtual Tour
          </Button>
        </div>
      </div>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{property.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {property.location}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">${property.price}</div>
            <div className="text-sm text-gray-500">per month</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              {property.bedrooms}
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              {property.bathrooms}
            </div>
            <div className="flex items-center">
              <Car className="h-4 w-4 mr-1" />
              {property.parking}
            </div>
            <div className="flex items-center">
              <Home className="h-4 w-4 mr-1" />
              {property.size}sq ft
            </div>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="text-sm font-medium">{property.rating}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {property.features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
          {property.features.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{property.features.length - 3} more
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={() => setSelectedProperty(property)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const MaintenanceCard = ({ request }: { request: MaintenanceRequest }) => (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{request.title}</CardTitle>
            <CardDescription>{request.property}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              request.priority === 'urgent' ? 'destructive' :
              request.priority === 'high' ? 'default' :
              request.priority === 'medium' ? 'secondary' : 'outline'
            }>
              {request.priority}
            </Badge>
            <Badge variant={
              request.status === 'completed' ? 'default' :
              request.status === 'in-progress' ? 'secondary' : 'outline'
            }>
              {request.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">{request.description}</p>
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {request.dateCreated}
          </div>
          {request.estimatedCompletion && (
            <div className="flex items-center text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              Est: {request.estimatedCompletion}
            </div>
          )}
        </div>
        {request.assignedTo && (
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <User className="h-4 w-4 mr-1" />
            Assigned to: {request.assignedTo}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">WeLet Properties</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">Browse Properties</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Browse Properties Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search properties by title or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="studio">Studio</option>
                </select>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Any Bedrooms</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Properties Grid */}
            {propertiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}

            {filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No properties found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-gray-500 mt-1">+2 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Available Units</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-gray-500 mt-1">25% vacancy rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$28,500</div>
                  <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Maintenance Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-gray-500 mt-1">2 urgent, 3 routine</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: CheckCircle, text: "Maintenance completed - Unit 4B", time: "2 hours ago", color: "text-green-600" },
                    { icon: AlertCircle, text: "New maintenance request - Unit 12A", time: "4 hours ago", color: "text-orange-600" },
                    { icon: User, text: "New tenant moved in - Unit 7C", time: "1 day ago", color: "text-blue-600" },
                    { icon: DollarSign, text: "Rent payment received - Unit 3A", time: "2 days ago", color: "text-green-600" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      <div className="flex-1">
                        <p className="text-sm">{activity.text}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Maintenance Requests</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>

            {maintenanceLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {maintenanceRequests.map((request) => (
                  <MaintenanceCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Occupancy Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">87%</div>
                  <p className="text-sm text-gray-500 mt-1">+5% from last quarter</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Average Rent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$2,850</div>
                  <p className="text-sm text-gray-500 mt-1">Market competitive</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Avg Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">2.3h</div>
                  <p className="text-sm text-gray-500 mt-1">Below 4h target</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Property Details Modal */}
      {selectedProperty && (
        <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProperty.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Property Image Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <img 
                  src={selectedProperty.image} 
                  alt={selectedProperty.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="grid grid-cols-2 gap-2">
                  {selectedProperty.galleryImages.map((image, index) => (
                    <img 
                      key={index}
                      src={image} 
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                  ))}
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Property Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">${selectedProperty.price}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span>{selectedProperty.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{selectedProperty.size} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{selectedProperty.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={selectedProperty.status === 'available' ? 'default' : 'secondary'}>
                        {selectedProperty.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Landlord Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span>{selectedProperty.landlord.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>{selectedProperty.landlord.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span>{selectedProperty.landlord.responseTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-gray-600">{selectedProperty.description}</p>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.features.map((feature, index) => (
                    <Badge key={index} variant="outline">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Landlord
                </Button>
                <Button variant="outline" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Viewing
                </Button>
                <Button variant="outline" onClick={() => setShowVirtualTour(true)}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Virtual Tour
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Virtual Tour Modal */}
      {showVirtualTour && (
        <Dialog open={showVirtualTour} onOpenChange={setShowVirtualTour}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Virtual Tour</DialogTitle>
            </DialogHeader>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">360° Virtual Tour</h3>
                <p className="text-gray-500">Interactive virtual tour would be embedded here</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Chat Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setShowChat(true)}
          className="rounded-full h-14 w-14 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* AI Chat Modal */}
      {showChat && (
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>AI Assistant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="h-64 overflow-y-auto space-y-2">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Hi! I'm your AI assistant. How can I help you today?</p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div key={message.id} className={`p-2 rounded-lg ${
                      message.type === 'user' ? 'bg-primary text-white ml-8' : 'bg-gray-100 mr-8'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WeLet;