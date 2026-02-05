import { LINE_CONFIGS } from '../constants';
import { MachineData, MachineStatus } from '../types';

/**
 * SIMULATOR SERVICE
 * In a real environment, this would be a WebSocket wrapper connecting to Node-RED.
 * I am mocking this to ensure the "Industrial Viewport Pro" works immediately 
 * without needing the actual backend running.
 */

type Callback = (data: MachineData[]) => void;

class MockNodeRedService {
  private intervalId: number | null = null;
  private subscribers: Callback[] = [];
  
  // Simulation state to keep trends looking realistic
  private mockState: Record<string, { count: number; status: MachineStatus; trend: number[] }> = {};

  constructor() {
    // Initialize mock state
    LINE_CONFIGS.forEach(line => {
      this.mockState[line.id] = {
        count: 0,
        status: Math.random() > 0.1 ? 'RUNNING' : 'STOPPED',
        trend: Array(10).fill(0).map(() => Math.floor(Math.random() * 100))
      };
    });
  }

  public connect(onMessage: Callback, onStatusChange: (status: string) => void) {
    onStatusChange('CONNECTING');
    this.subscribers.push(onMessage);

    // Simulate network delay
    setTimeout(() => {
      onStatusChange('CONNECTED');
      this.startDataStream();
    }, 1000);

    return () => this.disconnect();
  }

  public disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.subscribers = [];
  }

  private startDataStream() {
    this.intervalId = window.setInterval(() => {
      const now = new Date();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const payload: MachineData[] = LINE_CONFIGS.map(line => {
        const current = this.mockState[line.id];
        
        // Randomly change status occasionally
        if (Math.random() > 0.95) {
            const statuses: MachineStatus[] = ['RUNNING', 'STOPPED', 'ALARM'];
            current.status = statuses[Math.floor(Math.random() * statuses.length)];
        }

        // Increment count if running
        if (current.status === 'RUNNING') {
            current.count += Math.floor(Math.random() * 5);
        }

        // Update trend
        const newValue = Math.floor(Math.random() * 100);
        current.trend.shift();
        current.trend.push(newValue);

        // Map internal trend to API format
        const trendPoints = current.trend.map((val, idx) => ({
            time: idx.toString(), // Simplified for demo
            value: val
        }));

        // Simulate Hourly Rate based on efficiency
        const efficiency = current.status === 'RUNNING' ? 85 + (Math.random() * 10) : 0;
        const currentHourlyRate = Math.floor((line.targetPerHour || 100) * (efficiency / 100));

        return {
          lineId: line.id,
          status: current.status,
          productionCount: current.count,
          currentHourlyRate: currentHourlyRate, // Data for "Horária"
          rejectCount: Math.floor(current.count * 0.02), // 2% scrap rate
          temperature: 40 + Math.random() * 20,
          efficiency: efficiency, // Data for "PB"
          lastUpdated: Date.now(),
          trend: trendPoints
        };
      });

      this.notify(payload);
    }, 2000);
  }

  private notify(data: MachineData[]) {
    this.subscribers.forEach(sub => sub(data));
  }
}

export const nodeRedService = new MockNodeRedService();