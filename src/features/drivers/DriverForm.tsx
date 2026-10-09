import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Field, SelectInput, TextInput } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { CITY_OPTIONS, DRIVER_STATUS } from '@/lib/constants';
import { errorMessage, toDateInput } from '@/lib/format';
import { useFleetStore } from '@/store/useFleetStore';
import { toast } from '@/store/useToastStore';
import type { Driver } from '@/types';

const makeSchema = (takenEmails: string[]) =>
  z.object({
    name: z.string().trim().min(2, 'Enter the driver\'s full name'),
    email: z.string().trim().email('Enter a valid email address').refine((e) => !takenEmails.includes(e.toLowerCase()), 'A driver with this email already exists'),
    phone: z.string().trim().regex(/^\+?[\d\s-]{8,16}$/, 'Enter a valid phone number'),
    licenseNo: z.string().trim().min(6, 'Enter the full licence number'),
    licenseExpiry: z.string().min(1, 'Choose the licence expiry date').refine((d) => d > toDateInput(new Date()), 'This licence has already expired'),
    city: z.string().min(1, 'Choose a city'),
    status: z.enum(['available', 'on_trip', 'off_duty', 'on_leave']),
  });
type Values = z.infer<ReturnType<typeof makeSchema>>;
const blank = (): Values => ({ name: '', email: '', phone: '', licenseNo: '', licenseExpiry: '', city: 'Chennai', status: 'available' });

export function DriverForm({ open, onClose, driver }: { open: boolean; onClose: () => void; driver?: Driver | null }) {
  const drivers = useFleetStore((s) => s.drivers);
  const addDriver = useFleetStore((s) => s.addDriver);
  const updateDriver = useFleetStore((s) => s.updateDriver);
  const taken = useMemo(() => drivers.filter((d) => d.id !== driver?.id).map((d) => d.email.toLowerCase()), [drivers, driver]);
  const schema = useMemo(() => makeSchema(taken), [taken]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: blank() });

  useEffect(() => {
    if (!open) return;
    reset(driver ? { name: driver.name, email: driver.email, phone: driver.phone, licenseNo: driver.licenseNo, licenseExpiry: toDateInput(driver.licenseExpiry), city: driver.city, status: driver.status } : blank());
  }, [open, driver, reset]);

  const onSubmit = handleSubmit(async (v) => {
    try {
      const input = { ...v, licenseExpiry: new Date(v.licenseExpiry).toISOString() };
      if (driver) await updateDriver(driver.id, input); else await addDriver(input);
      toast.success(driver ? `${v.name} updated` : `${v.name} added`);
      onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  });

  return (
    <Modal open={open} onClose={onClose} title={driver ? `Edit ${driver.name}` : 'Add driver'}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message} className="sm:col-span-2"><TextInput {...register('name')} invalid={!!errors.name} autoComplete="off" /></Field>
          <Field label="Email" error={errors.email?.message}><TextInput type="email" {...register('email')} invalid={!!errors.email} /></Field>
          <Field label="Phone" error={errors.phone?.message}><TextInput type="tel" {...register('phone')} invalid={!!errors.phone} placeholder="+91 98765 43210" /></Field>
          <Field label="Licence number" error={errors.licenseNo?.message}><TextInput {...register('licenseNo')} invalid={!!errors.licenseNo} /></Field>
          <Field label="Licence expiry" error={errors.licenseExpiry?.message}><TextInput type="date" {...register('licenseExpiry')} invalid={!!errors.licenseExpiry} /></Field>
          <Field label="Home city"><SelectInput {...register('city')}>{CITY_OPTIONS.map((c) => <option key={c.value}>{c.label}</option>)}</SelectInput></Field>
          <Field label="Status"><SelectInput {...register('status')}>{Object.entries(DRIVER_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</SelectInput></Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{driver ? 'Save changes' : 'Add driver'}</Button>
        </div>
      </form>
    </Modal>
  );
}
