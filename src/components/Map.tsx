import * as React from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation } from 'lucide-react';

interface MapProps {
  pickup?: { lat: number; lng: number; address: string };
  destination?: { lat: number; lng: number; address: string };
  driverLocation?: { lat: number; lng: number };
}

export function Map({ pickup, destination, driverLocation }: MapProps) {
  return (
    <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      {/* Simulated Streets */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-full h-4 bg-slate-200" />
        <div className="absolute top-3/4 left-0 w-full h-4 bg-slate-200" />
        <div className="absolute top-0 left-1/3 w-4 h-full bg-slate-200" />
        <div className="absolute top-0 left-2/3 w-4 h-full bg-slate-200" />
      </div>

      {/* Pickup Pin */}
      {pickup && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute z-10"
          style={{ top: '30%', left: '40%' }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-green-500 text-white p-1 rounded-full shadow-lg">
              <MapPin size={20} />
            </div>
            <div className="bg-white px-2 py-1 rounded text-[10px] font-bold shadow mt-1 border border-slate-100">
              {pickup.address}
            </div>
          </div>
        </motion.div>
      )}

      {/* Destination Pin */}
      {destination && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute z-10"
          style={{ top: '70%', left: '70%' }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-red-500 text-white p-1 rounded-full shadow-lg">
              <MapPin size={20} />
            </div>
            <div className="bg-white px-2 py-1 rounded text-[10px] font-bold shadow mt-1 border border-slate-100">
              {destination.address}
            </div>
          </div>
        </motion.div>
      )}

      {/* Driver Car */}
      {driverLocation && (
        <motion.div 
          animate={{ 
            top: `${driverLocation.lat}%`, 
            left: `${driverLocation.lng}%`,
            rotate: 45
          }}
          transition={{ type: 'spring', stiffness: 50 }}
          className="absolute z-20"
        >
          <div className="bg-black text-white p-1.5 rounded-lg shadow-xl transform -rotate-45">
            <Navigation size={16} fill="white" />
          </div>
        </motion.div>
      )}

      {/* Path Line (Simulated) */}
      {pickup && destination && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.path
            d="M 40% 30% L 70% 70%"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeDasharray="8 8"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
          />
        </svg>
      )}
    </div>
  );
}
