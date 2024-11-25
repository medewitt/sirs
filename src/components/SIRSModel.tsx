import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import init, { solve_sirs } from '../rust-sirs/pkg';

const SIRSModel = () => {
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [params, setParams] = useState({
    r0: 2.5,
    gamma: 0.2,
    immunityDuration: 180,
    duration: 365
  });
  const [data, setData] = useState([]);

  useEffect(() => {
    init().then(() => setWasmLoaded(true));
  }, []);

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const runSimulation = () => {
    if (!wasmLoaded) return;

    const solution = solve_sirs(
      params.r0,
      params.gamma,
      params.immunityDuration,
      params.duration
    );

    const formattedData = solution.map((point: number[]) => ({
      time: Math.round(point[0] * 10) / 10,
      susceptible: Math.round(point[1] * 1000) / 1000,
      infected: Math.round(point[2] * 1000) / 1000,
      recovered: Math.round(point[3] * 1000) / 1000
    }));

    setData(formattedData);
  };

  useEffect(() => {
    if (wasmLoaded) {
      runSimulation();
    }
  }, [params, wasmLoaded]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">SIRS Epidemic Model</h1>
      
      <div className="grid grid-cols-1 gap-8 w-full max-w-6xl">
        <div className="flex justify-center space-x-4">
          <div className="w-full max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                R₀ (Basic Reproduction Number)
              </label>
              <input
                type="number"
                name="r0"
                value={params.r0}
                onChange={handleParamChange}
                step="0.1"
                min="0"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                γ (Recovery Rate - per day)
              </label>
              <input
                type="number"
                name="gamma"
                value={params.gamma}
                onChange={handleParamChange}
                step="0.01"
                min="0"
                max="1"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Immunity Duration (days)
              </label>
              <input
                type="number"
                name="immunityDuration"
                value={params.immunityDuration}
                onChange={handleParamChange}
                step="1"
                min="1"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Simulation Duration (days)
              </label>
              <input
                type="number"
                name="duration"
                value={params.duration}
                onChange={handleParamChange}
                step="1"
                min="1"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded shadow">
            <LineChart width={800} height={500} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                label={{ value: 'Time (days)', position: 'bottom' }}
                tickFormatter={val => (Math.round(val * 10) / 10).toString()}
              />
              <YAxis 
                label={{ value: 'Population Fraction', angle: -90, position: 'left' }}
                tickFormatter={val => (Math.round(val * 10) / 10).toString()}
              />
              <Tooltip 
                formatter={(value: number) => Math.round(value * 1000) / 1000}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="susceptible" 
                stroke="#8884d8" 
                name="Susceptible" 
              />
              <Line 
                type="monotone" 
                dataKey="infected" 
                stroke="#82ca9d" 
                name="Infected" 
              />
              <Line 
                type="monotone" 
                dataKey="recovered" 
                stroke="#ffc658" 
                name="Recovered" 
              />
            </LineChart>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SIRSModel;
