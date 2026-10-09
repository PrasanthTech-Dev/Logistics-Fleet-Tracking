import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Field, SelectInput, TextInput } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { CITY_OPTIONS, PRIORITY } from '@/lib/constants';
import { errorMessage, toLocalInput } from '@/lib/format';
import { useFleetStore } from '@/store/useFleetStore';
import { toast } from '@/store/useToastStore';
import type { Shipment } from '@/types';

const schema = z.object({
  customerName: z.string().trim().min(2, 'Enter the customer name'),
  customerEmail: z.string().trim().email('Enter a valid email address'),
  customerPhone: z.string().trim().regex(/^\+?[\d\s-]{8,16}$/, 'Enter a valid phone number'),
  pickupCity: z.string().min(1, 'Choose a pickup city'),
  pickupAddress: z.string().trim().min(5, 'Enter the pickup address'),
  deliveryCity: z.string().min(1, 'Choose a delivery city'),
  deliveryAddress: z.string().trim().min(5, 'Enter the delivery address'),
  weightKg: z.number({ invalid_type_error: 'Enter the weight in kg' }).positive('Weight must be above 0').max(40000, 'Maximum load is 40,000 kg'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  scheduledAt: z.string().min(1, 'Choose a pickup time'),
  driverId: z.string(),
  vehicleId: z.string(),
}).refine((v) => v.pickupCity !== v.deliveryCity, { path: ['deliveryCity'], message: 'Delivery city must differ from the pickup city' })
  .refine((v) => !!v.driverId === !!v.vehicleId, { path: ['vehicleId'], message: 'Assign a driver and a vehicle together, or leave both empty' });
type Values = z.infer<typeof schema>;

const blank = (): Values => ({
  customerName: '', customerEmail: '', customerPhone: '', pickupCity: 'Chennai', pickupAddress: '', deliveryCity: 'Bengaluru', deliveryAddress: '',
  weightKg: 1000, priority: 'normal', scheduledAt: toLocalInput(new Date(Date.now() + 3 * 3_600_000)), driverId: '', vehicleId: '',
});

export function ShipmentForm({ open, onClose, shipment }: { open: boolean; onClose: () => void; shipment?: Shipment | null }) {
  const drivers = useFleetStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const addShipment = useFleetStore((s) => s.addShipment);
  const updateShipment = useFleetStore((s) => s.updateShipment);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: blank() });

  // Only offer resources that can actually take a job (plus the current assignment when editing).
  const driverOptions = useMemo(() => drivers.filter((d) => d.status === 'available' || d.id === shipment?.driverId), [drivers, shipment]);
  const vehicleOptions = useMemo(() => vehicles.filter((v) => v.status === 'idle' || v.id === shipment?.vehicleId), [vehicles, shipment]);

  useEffect(() => {
    if (!open) return;
    reset(shipment ? {
      customerName: shipment.customer.name, customerEmail: shipment.customer.email, customerPhone: shipment.customer.phone,
      pickupCity: shipment.pickup.city, pickupAddress: shipment.pickup.address, deliveryCity: shipment.delivery.city, deliveryAddress: shipment.delivery.address,
      weightKg: shipment.weightKg, priority: shipment.priority, scheduledAt: toLocalInput(new Date(shipment.scheduledAt)),
      driverId: shipment.driverId ?? '', vehicleId: shipment.vehicleId ?? '',
    } : blank());
  }, [open, shipment, reset]);

  const onSubmit = handleSubmit(async (v) => {
    try {
      const input = {
        customer: { name: v.customerName, email: v.customerEmail, phone: v.customerPhone },
        pickup: { city: v.pickupCity, address: v.pickupAddress }, delivery: { city: v.deliveryCity, address: v.deliveryAddress },
        weightKg: v.weightKg, priority: v.priority, scheduledAt: new Date(v.scheduledAt).toISOString(),
        driverId: v.driverId || null, vehicleId: v.vehicleId || null,
      };
      if (shipment) await updateShipment(shipment.id, input); else await addShipment(input);
      toast.success(shipment ? `${shipment.id} updated` : 'Shipment created');
      onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  });

  return (
    <Modal open={open} onClose={onClose} title={shipment ? `Edit ${shipment.id}` : 'Create shipment'} size="lg">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <fieldset className="space-y-3"><legend className="mb-1 text-sm font-bold text-white">Customer</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Name" error={errors.customerName?.message}><TextInput {...register('customerName')} invalid={!!errors.customerName} /></Field>
            <Field label="Email" error={errors.customerEmail?.message}><TextInput type="email" {...register('customerEmail')} invalid={!!errors.customerEmail} /></Field>
            <Field label="Phone" error={errors.customerPhone?.message}><TextInput type="tel" {...register('customerPhone')} invalid={!!errors.customerPhone} /></Field>
          </div>
        </fieldset>
        <fieldset className="space-y-3"><legend className="mb-1 text-sm font-bold text-white">Route</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pickup city" error={errors.pickupCity?.message}><SelectInput {...register('pickupCity')}>{CITY_OPTIONS.map((c) => <option key={c.value}>{c.label}</option>)}</SelectInput></Field>
            <Field label="Delivery city" error={errors.deliveryCity?.message}><SelectInput {...register('deliveryCity')} invalid={!!errors.deliveryCity}>{CITY_OPTIONS.map((c) => <option key={c.value}>{c.label}</option>)}</SelectInput></Field>
            <Field label="Pickup address" error={errors.pickupAddress?.message}><TextInput {...register('pickupAddress')} invalid={!!errors.pickupAddress} placeholder="Unit, street, area" /></Field>
            <Field label="Delivery address" error={errors.deliveryAddress?.message}><TextInput {...register('deliveryAddress')} invalid={!!errors.deliveryAddress} placeholder="Unit, street, area" /></Field>
          </div>
        </fieldset>
        <fieldset className="space-y-3"><legend className="mb-1 text-sm font-bold text-white">Load and schedule</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Weight (kg)" error={errors.weightKg?.message}><TextInput type="number" {...register('weightKg', { valueAsNumber: true })} invalid={!!errors.weightKg} /></Field>
            <Field label="Priority"><SelectInput {...register('priority')}>{Object.entries(PRIORITY).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</SelectInput></Field>
            <Field label="Pickup time" error={errors.scheduledAt?.message}><TextInput type="datetime-local" {...register('scheduledAt')} invalid={!!errors.scheduledAt} /></Field>
          </div>
        </fieldset>
        <fieldset className="space-y-3"><legend className="mb-1 text-sm font-bold text-white">Assignment</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Driver" hint="Only available drivers are listed."><SelectInput {...register('driverId')}><option value="">Assign later</option>{driverOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</SelectInput></Field>
            <Field label="Vehicle" error={errors.vehicleId?.message} hint="Only idle vehicles are listed."><SelectInput {...register('vehicleId')} invalid={!!errors.vehicleId}><option value="">Assign later</option>{vehicleOptions.map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.make} {v.model}</option>)}</SelectInput></Field>
          </div>
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{shipment ? 'Save changes' : 'Create shipment'}</Button>
        </div>
      </form>
    </Modal>
  );
}
