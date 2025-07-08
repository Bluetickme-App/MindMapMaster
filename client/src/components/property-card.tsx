import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bed, 
  Bath, 
  Square, 
  MapPin, 
  Eye,
  Calendar
} from 'lucide-react';

interface PropertyCardProps {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string;
  type: 'rent' | 'sale';
  featured?: boolean;
  onViewDetails?: () => void;
  onScheduleViewing?: () => void;
}

export default function PropertyCard({
  id,
  title,
  address,
  price,
  bedrooms,
  bathrooms,
  sqft,
  image,
  type,
  featured = false,
  onViewDetails,
  onScheduleViewing
}: PropertyCardProps) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {featured && (
          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-teal-600 to-blue-600">
            Featured
          </Badge>
        )}
        <Badge className="absolute top-2 right-2" variant={type === 'rent' ? 'default' : 'secondary'}>
          For {type === 'rent' ? 'Rent' : 'Sale'}
        </Badge>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="line-clamp-1">{address}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-teal-600">
              £{price.toLocaleString()}
              {type === 'rent' && <span className="text-sm font-normal">/mo</span>}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            <span>{bedrooms} beds</span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span>{bathrooms} baths</span>
          </div>
          <div className="flex items-center">
            <Square className="w-4 h-4 mr-1" />
            <span>{sqft} sqft</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onViewDetails}
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1"
            onClick={onScheduleViewing}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Schedule Viewing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}