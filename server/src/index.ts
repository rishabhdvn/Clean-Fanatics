import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { BookingService } from './bookingService';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. Create Booking
app.post('/bookings', async (req, res) => {
  const booking = await BookingService.create(req.body.service);
  res.json(booking);
});

// 2. Get All (Admin/List View)
app.get('/bookings', async (req, res) => {
  const bookings = await BookingService.getAll();
  res.json(bookings);
});

// 3. Update Status (The Workflow)
app.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { status, actor } = req.body;
    const updated = await BookingService.updateStatus(req.params.id, status, actor || 'User');
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(4000, () => console.log('🚀 Server running on port 4000'));