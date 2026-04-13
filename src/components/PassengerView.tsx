import * as React from 'react';
import { useState, useEffect } from 'react';
import { db, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Map } from './Map';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Search, MapPin, Car, Clock, CreditCard, History, ChevronRight } from 'lucide-react';
import { getPriceEstimate } from '../lib/gemini';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PassengerView() {
  const { user } = useAuth();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [estimate, setEstimate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Active Ride Listener
    const qActive = query(
      collection(db, 'rides'),
      where('passengerId', '==', user.uid),
      where('status', 'in', ['requested', 'accepted', 'ongoing'])
    );

    const unsubscribeActive = onSnapshot(qActive, (snapshot) => {
      if (!snapshot.empty) {
        setActiveRide({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActiveRide(null);
      }
    });

    // History Listener
    const qHistory = query(
      collection(db, 'rides'),
      where('passengerId', '==', user.uid),
      where('status', 'in', ['completed', 'cancelled']),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeActive();
      unsubscribeHistory();
    };
  }, [user]);

  const handleEstimate = async () => {
    if (!pickup || !destination) return;
    setLoading(true);
    const price = await getPriceEstimate(pickup, destination);
    setEstimate(price);
    setLoading(false);
  };

  const requestRide = async () => {
    if (!user || !pickup || !destination || !estimate) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'rides'), {
        passengerId: user.uid,
        pickupLocation: { address: pickup, lat: 30, lng: 40 },
        destinationLocation: { address: destination, lat: 70, lng: 70 },
        status: 'requested',
        price: estimate,
        createdAt: serverTimestamp(),
      });
      toast.success('Corrida solicitada! Aguardando motorista...');
    } catch (e) {
      toast.error('Erro ao solicitar corrida.');
    }
    setLoading(false);
  };

  const cancelRide = async () => {
    if (!activeRide) return;
    await updateDoc(doc(db, 'rides', activeRide.id), { status: 'cancelled' });
    toast.info('Corrida cancelada.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      <div className="lg:col-span-2 relative">
        <Map 
          pickup={activeRide ? activeRide.pickupLocation : (estimate ? { address: pickup, lat: 30, lng: 40 } : undefined)}
          destination={activeRide ? activeRide.destinationLocation : (estimate ? { address: destination, lat: 70, lng: 70 } : undefined)}
        />
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 pb-6">
        {!activeRide ? (
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Car className="text-blue-600" /> Para onde vamos?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                  <Input 
                    placeholder="Local de partida" 
                    className="pl-10 h-12"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <Input 
                    placeholder="Para onde?" 
                    className="pl-10 h-12"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              {estimate ? (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Preço estimado</span>
                    <span className="text-2xl font-bold text-blue-700">R$ {estimate.toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
                    onClick={requestRide}
                    disabled={loading}
                  >
                    Solicitar Amuvi
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-500"
                    onClick={() => setEstimate(null)}
                  >
                    Alterar rota
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full h-12 text-lg font-bold"
                  onClick={handleEstimate}
                  disabled={loading || !pickup || !destination}
                >
                  {loading ? 'Calculando...' : 'Ver Preço'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Corrida Ativa</CardTitle>
                <Badge variant={activeRide.status === 'requested' ? 'secondary' : 'default'} className="animate-pulse">
                  {activeRide.status === 'requested' ? 'Procurando...' : 'Em andamento'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Car className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="font-bold text-slate-800">
                    {activeRide.status === 'requested' ? 'Aguardando motorista aceitar' : 'Motorista a caminho'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Partida</p>
                    <p className="text-sm font-medium">{activeRide.pickupLocation.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Destino</p>
                    <p className="text-sm font-medium">{activeRide.destinationLocation.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-slate-400" />
                  <span className="font-bold">R$ {activeRide.price.toFixed(2)}</span>
                </div>
                <Button variant="destructive" onClick={cancelRide}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-lg bg-slate-900 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-blue-400" />
              <div>
                <p className="text-xs opacity-70">Tempo médio de espera</p>
                <p className="font-bold">4-6 min</p>
              </div>
            </div>
            <Badge className="bg-blue-500">Promo Ativa</Badge>
          </CardContent>
        </Card>

        {/* History Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History size={20} className="text-slate-400" /> Histórico Recente
          </h3>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Nenhuma corrida anterior encontrada.</p>
          ) : (
            <div className="space-y-3">
              {history.map((ride) => (
                <Card key={ride.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {ride.createdAt?.toDate ? format(ride.createdAt.toDate(), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Recent'}
                        </span>
                        <Badge variant={ride.status === 'completed' ? 'default' : 'destructive'} className="w-fit text-[10px] h-4 px-1.5 mt-1">
                          {ride.status === 'completed' ? 'Concluída' : 'Cancelada'}
                        </Badge>
                      </div>
                      <span className="font-bold text-slate-700">R$ {ride.price?.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="truncate">{ride.pickupLocation.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span className="truncate">{ride.destinationLocation.address}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

