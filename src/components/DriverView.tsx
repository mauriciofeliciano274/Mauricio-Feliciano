import * as React from 'react';
import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, setDoc } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Map } from './Map';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Car, MapPin, DollarSign, Star, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Seg', total: 120 },
  { name: 'Ter', total: 150 },
  { name: 'Qua', total: 200 },
  { name: 'Qui', total: 180 },
  { name: 'Sex', total: 350 },
  { name: 'Sab', total: 450 },
  { name: 'Dom', total: 300 },
];

export function DriverView() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [activeRide, setActiveRide] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Listen for available rides
    const qAvailable = query(
      collection(db, 'rides'),
      where('status', '==', 'requested')
    );

    const unsubscribeAvailable = onSnapshot(qAvailable, (snapshot) => {
      setAvailableRides(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen for active ride
    const qActive = query(
      collection(db, 'rides'),
      where('driverId', '==', user.uid),
      where('status', 'in', ['accepted', 'ongoing'])
    );

    const unsubscribeActive = onSnapshot(qActive, (snapshot) => {
      if (!snapshot.empty) {
        setActiveRide({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActiveRide(null);
      }
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeActive();
    };
  }, [user]);

  const toggleOnline = async (checked: boolean) => {
    if (!user) return;
    setIsOnline(checked);
    await setDoc(doc(db, 'driverStatus', user.uid), {
      uid: user.uid,
      isOnline: checked,
      lastUpdated: serverTimestamp(),
      currentLocation: { lat: 30, lng: 40 }
    }, { merge: true });
    
    if (checked) {
      toast.success('Você está online! Aguardando chamadas.');
    } else {
      toast.info('Você está offline.');
    }
  };

  const acceptRide = async (rideId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        driverId: user.uid,
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      toast.success('Corrida aceita! Vá até o passageiro.');
    } catch (e) {
      toast.error('Erro ao aceitar corrida. Talvez outro motorista já tenha aceitado.');
    }
  };

  const completeRide = async () => {
    if (!activeRide) return;
    await updateDoc(doc(db, 'rides', activeRide.id), {
      status: 'completed',
      completedAt: serverTimestamp()
    });
    toast.success('Corrida finalizada com sucesso!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            <div>
              <p className="text-sm font-bold text-slate-800">{isOnline ? 'Disponível' : 'Indisponível'}</p>
              <p className="text-xs text-slate-500">Seu status atual</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="online-mode" className="text-sm font-medium">Ficar Online</Label>
            <Switch 
              id="online-mode" 
              checked={isOnline}
              onCheckedChange={toggleOnline}
            />
          </div>
        </div>

        {activeRide ? (
          <Card className="border-none shadow-xl bg-blue-600 text-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Corrida em Andamento</CardTitle>
                <Badge className="bg-white text-blue-600">Ativa</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/30 p-4 rounded-xl">
                  <p className="text-xs opacity-80 uppercase font-bold">Ganhos</p>
                  <p className="text-2xl font-bold">R$ {activeRide.price.toFixed(2)}</p>
                </div>
                <div className="bg-blue-500/30 p-4 rounded-xl">
                  <p className="text-xs opacity-80 uppercase font-bold">Distância</p>
                  <p className="text-2xl font-bold">4.2 km</p>
                </div>
              </div>

              <div className="space-y-4 bg-white/10 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-1" />
                  <div>
                    <p className="text-xs opacity-70">Pickup</p>
                    <p className="font-medium">{activeRide.pickupLocation.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car size={18} className="mt-1" />
                  <div>
                    <p className="text-xs opacity-70">Destino</p>
                    <p className="font-medium">{activeRide.destinationLocation.address}</p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 bg-white text-blue-600 hover:bg-slate-100 font-bold text-lg"
                onClick={completeRide}
              >
                Finalizar Corrida
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Chamadas Próximas ({availableRides.length})</h3>
            {availableRides.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Car className="mx-auto text-slate-300 mb-2" size={48} />
                <p className="text-slate-500">Nenhuma chamada no momento.</p>
              </div>
            ) : (
              availableRides.map(ride => (
                <Card key={ride.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-blue-600 border-blue-200">R$ {ride.price.toFixed(2)}</Badge>
                        <span className="text-xs text-slate-400">3.5 km de você</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
                        {ride.pickupLocation.address}
                      </p>
                      <p className="text-xs text-slate-500">Destino: {ride.destinationLocation.address}</p>
                    </div>
                    <Button 
                      onClick={() => acceptRide(ride.id)}
                      disabled={!isOnline}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Aceitar
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" /> Desempenho Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-lg bg-white">
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Ganhos Hoje</p>
                <p className="text-3xl font-black text-slate-900">R$ 248,50</p>
              </div>
              <div className="p-3 bg-green-50 rounded-2xl">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-bold">Avaliação</span>
                </div>
                <p className="text-xl font-bold">4.92</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Car size={14} className="text-blue-500" />
                  <span className="text-xs font-bold">Corridas</span>
                </div>
                <p className="text-xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="h-[300px] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
          <Map driverLocation={isOnline ? { lat: 30, lng: 40 } : undefined} />
        </div>
      </div>
    </div>
  );
}
