import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Field, SelectInput, TextInput } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { CITY_OPTIONS, FUEL_TYPES, VEHICLE_STATUS, VEHICLE_TYPES } from '@/lib/constants';
import { errorMessage, toDateInput } from '@/lib/format';
import { useFleetStore } from '@/store/useFleetStore';
import { toast } from '@/store/useToastStore';
import type { Vehicle } from '@/types';

const num = (label: string) => z.number({ invalid_type_error: `Enter a valid ${label}` });
const makeSchema = (taken: string[]) =>
  z.object({
    plate: z.string().trim().min(5, 'Enter the full registration number').transform((s) => s.toUpperCase())
      .refine((p) => !taken.includes(p), 'A vehicle with this registration already exists'),
    type: z.enum(['Truck', 'Van', 'Pickup', 'Trailer']),
    make: z.string().trim().min(2, 'Enter the manufacturer'),
    model: z.string().trim().min(1, 'Enter the model'),
    year: num('year').int().min(1990, 'Year must be 1990 or later').max(new Date().getFullYear() + 1, 'Year is too far ahead'),
    fuelType: z.enum(['Diesel', 'Petrol', 'CNG', 'Electric']),
    fuelLevel: num('fuel level').min(0, 'Minimum is 0%').max(100, 'Maximum is 100%'),
    odometer: num('odometer reading').min(0, 'Cannot be negative'),
    status: z.enum(['active', 'idle', 'maintenance', 'offline']),
    city: z.string().min(1, 'Choose a base city'),
    driverId: z.string(),
    lastServiceDate: z.string().min(1, 'Choose the last service date'),
    nextServiceDate: z.string().min(1, 'Choose the next service date'),
  }).refine((v) => v.nextServiceDate >= v.lastServiceDate, { path: ['nextServiceDate'], message: 'Next service must be after the last one' });
type Values = z.infer<ReturnType<typeof makeSchema>>;

const blank = (): Values => ({
  plate: '', type: 'Truck', make: '', model: '', year: new Date().getFullYear(), fuelType: 'Diesel', fuelLevel: 100, odometer: 0,
  status: 'idle', city: 'Chennai', driverId: '', lastServiceDate: toDateInput(new Date()),
  nextServiceDate: toDateInput(new Date(Date.now() + 90 * 86_400_000)),
});

export function VehicleForm({ open, onClose, vehicle }: { open: boolean; onClose: () => void; vehicle?: Vehicle | null }) {
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useFleetStore((s) => s.drivers);
  const addVehicle = useFleetStore((s) => s.addVehicle);
  const updateVehicle = useFleetStore((s) => s.updateVehicle);
  const taken = useMemo(() => vehicles.filter((v) => v.id !== vehicle?.id).map((v) => v.plate.toUpperCase()), [vehicles, vehicle]);
  const schema = useMemo(() => makeSchema(taken), [taken]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: blank() });

  useEffect(() => {
    if (!open) return;
    reset(vehicle ? {
      plate: vehicle.plate, type: vehicle.type, make: vehicle.make, model: vehicle.model, year: vehicle.year, fuelType: vehicle.fuelType,
      fuelLevel: vehicle.fuelLevel, odometer: vehicle.odometer, status: vehicle.status, city: vehicle.city, driverId: vehicle.driverId ?? '',
      lastServiceDate: toDateInput(vehicle.lastServiceDate), nextServiceDate: toDateInput(vehicle.nextServiceDate),
    } : blank());
  }, [open, vehicle, reset]);

  const onSubmit = handleSubmit(async (v) => {
    try {
      const input = { ...v, driverId: v.driverId || null };
      if (vehicle) await updateVehicle(vehicle.id, input); else await addVehicle(input);
      toast.success(vehicle ? `${v.plate} updated` : `${v.plate} added to the fleet`);
      onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  });

  return (
    <Modal open={open} onClose={onClose} title={vehicle ? `Edit ${vehicle.plate}` : 'Add vehicle'} size="lg">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Registration number" error={errors.plate?.message}><TextInput {...register('plate')} invalid={!!errors.plate} placeholder="TN 09 AB 1234" /></Field>
          <Field label="Vehicle type"><SelectInput {...register('type')}>{VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}</SelectInput></Field>
          <Field label="Make" error={errors.make?.message}><TextInput {...register('make')} invalid={!!errors.make} placeholder="Tata" /></Field>
          <Field label="Model" error={errors.model?.message}><TextInput {...register('model')} invalid={!!errors.model} placeholder="Prima 4028" /></Field>
          <Field label="Year" error={errors.year?.message}><TextInput type="number" {...register('year', { valueAsNumber: true })} invalid={!!errors.year} /></Field>
          <Field label="Fuel type"><SelectInput {...register('fuelType')}>{FUEL_TYPES.map((t) => <option key={t}>{t}</option>)}</SelectInput></Field>
          <Field label="Fuel level (%)" error={errors.fuelLevel?.message}><TextInput type="number" {...register('fuelLevel', { valueAsNumber: true })} invalid={!!errors.fuelLevel} /></Field>
          <Field label="Odometer (km)" error={errors.odometer?.message}><TextInput type="number" {...register('odometer', { valueAsNumber: true })} invalid={!!errors.odometer} /></Field>
          <Field label="Status"><SelectInput {...register('status')}>{Object.entries(VEHICLE_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</SelectInput></Field>
          <Field label="Base city" error={errors.city?.message}><SelectInput {...register('city')}>{CITY_OPTIONS.map((c) => <option key={c.value}>{c.label}</option>)}</SelectInput></Field>
          <Field label="Assigned driver" hint="Assigning a driver here moves them from any other vehicle.">
            <SelectInput {...register('driverId')}><option value="">Unassigned</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</SelectInput>
          </Field>
          <div className="hidden sm:block" />
          <Field label="Last service" error={errors.lastServiceDate?.message}><TextInput type="date" {...register('lastServiceDate')} invalid={!!errors.lastServiceDate} /></Field>
          <Field label="Next service due" error={errors.nextServiceDate?.message}><TextInput type="date" {...register('nextServiceDate')} invalid={!!errors.nextServiceDate} /></Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{vehicle ? 'Save changes' : 'Add vehicle'}</Button>
        </div>
      </form>
    </Modal>
  );
}
