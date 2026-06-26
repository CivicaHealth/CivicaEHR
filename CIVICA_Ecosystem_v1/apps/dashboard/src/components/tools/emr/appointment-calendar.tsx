'use client';

import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core';
import type { EventResizeDoneArg, DateClickArg } from '@fullcalendar/interaction';
import { Button, Input, Label, Select, Textarea, FormError } from '@civica/ui';

const STATUS_OPTIONS = [
  ['scheduled', 'Scheduled'],
  ['arrived', 'Arrived'],
  ['in_progress', 'In Progress'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['no_show', 'No Show'],
] as const;

const DURATION_OPTIONS = [10, 15, 30, 45, 60, 90, 120, 180];

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface ModalState {
  id?: string;
  patientId: string;
  datetime: string;
  duration: string;
  reason: string;
  status: string;
  notes: string;
}

const EMPTY_MODAL: ModalState = {
  patientId: '',
  datetime: '',
  duration: '30',
  reason: '',
  status: 'scheduled',
  notes: '',
};

export function AppointmentCalendar({
  patients,
  canEdit,
}: {
  patients: { id: string; firstName: string; lastName: string }[];
  canEdit: boolean;
}) {
  const calendarRef = useRef<FullCalendar>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const refetch = () => calendarRef.current?.getApi().refetchEvents();

  const closeModal = () => {
    setModal(null);
    setError(undefined);
  };

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modal]);

  const openCreateModal = (datetime: string, duration?: string) => {
    if (!canEdit) return;
    setError(undefined);
    setModal({ ...EMPTY_MODAL, datetime, duration: duration ?? EMPTY_MODAL.duration });
  };

  const openEditModal = (info: EventClickArg) => {
    if (!canEdit) return;
    const p = info.event.extendedProps;
    setError(undefined);
    setModal({
      id: info.event.id,
      patientId: String(p.patientId ?? ''),
      datetime: info.event.start ? toLocalInputValue(info.event.start) : '',
      duration: String(p.duration ?? 30),
      reason: String(p.reason ?? ''),
      status: String(p.status ?? 'scheduled'),
      notes: String(p.notes ?? ''),
    });
  };

  const handleDateClick = (info: DateClickArg) => {
    openCreateModal(toLocalInputValue(info.date));
  };

  const handleSelect = (info: DateSelectArg) => {
    const diffMins = Math.round((info.end.getTime() - info.start.getTime()) / 60000);
    const closest = DURATION_OPTIONS.reduce((a, b) => (Math.abs(b - diffMins) < Math.abs(a - diffMins) ? b : a));
    openCreateModal(toLocalInputValue(info.start), String(closest));
    info.view.calendar.unselect();
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const duration = info.event.end
      ? Math.round((info.event.end.getTime() - info.event.start!.getTime()) / 60000)
      : Number(info.event.extendedProps.duration ?? 30);
    try {
      await patchAppointment(info.event.id, {
        appointmentDate: info.event.start!.toISOString(),
        durationMinutes: duration,
      });
    } catch {
      info.revert();
    }
  };

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const duration = Math.round((info.event.end!.getTime() - info.event.start!.getTime()) / 60000);
    try {
      await patchAppointment(info.event.id, { durationMinutes: duration });
    } catch {
      info.revert();
    }
  };

  async function patchAppointment(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/emr/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update appointment');
    refetch();
  }

  async function handleSave() {
    if (!modal) return;
    if (!modal.patientId) {
      setError('Please select a patient.');
      return;
    }
    if (!modal.datetime) {
      setError('Please choose a date & time.');
      return;
    }
    if (!modal.reason.trim()) {
      setError('Please enter a reason for visit.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      const payload = {
        emrPatientId: modal.patientId,
        appointmentDate: new Date(modal.datetime).toISOString(),
        durationMinutes: Number(modal.duration),
        reason: modal.reason.trim(),
        status: modal.status,
        notes: modal.notes,
      };
      const res = modal.id
        ? await fetch(`/api/emr/appointments/${modal.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/emr/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Error saving appointment.');
        return;
      }

      closeModal();
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!modal?.id) return;
    if (!confirm('Delete this appointment?')) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/emr/appointments/${modal.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Error deleting appointment.');
        return;
      }
      closeModal();
      refetch();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fc-civica rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
        height="calc(100vh - 280px)"
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:15:00"
        slotLabelInterval="01:00:00"
        allDaySlot={false}
        nowIndicator
        selectable={canEdit}
        selectMirror
        editable={canEdit}
        events={(info, success, failure) => {
          fetch(`/api/emr/appointments?start=${info.startStr}&end=${info.endStr}`)
            .then((res) => res.json())
            .then(success)
            .catch(failure);
        }}
        dateClick={handleDateClick}
        select={handleSelect}
        eventClick={openEditModal}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="w-full max-w-md rounded-lg bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <span className="text-sm font-semibold text-[var(--navy)]">
                {modal.id ? 'Edit Appointment' : 'Schedule Appointment'}
              </span>
              <button type="button" onClick={closeModal} className="text-[var(--muted)] hover:text-[var(--navy)]">
                ✕
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <FormError message={error} />

              <div>
                <Label htmlFor="modal-patient">Patient</Label>
                <Select
                  id="modal-patient"
                  value={modal.patientId}
                  onChange={(e) => setModal({ ...modal, patientId: e.target.value })}
                  disabled={!canEdit}
                >
                  <option value="">— Select patient —</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.lastName}, {patient.firstName}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="modal-datetime">Date & Time</Label>
                  <Input
                    id="modal-datetime"
                    type="datetime-local"
                    value={modal.datetime}
                    onChange={(e) => setModal({ ...modal, datetime: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label htmlFor="modal-duration">Duration</Label>
                  <Select
                    id="modal-duration"
                    value={modal.duration}
                    onChange={(e) => setModal({ ...modal, duration: e.target.value })}
                    disabled={!canEdit}
                  >
                    {DURATION_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1)} hr`}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="modal-reason">Reason for Visit</Label>
                <Input
                  id="modal-reason"
                  placeholder="e.g. Annual physical"
                  value={modal.reason}
                  onChange={(e) => setModal({ ...modal, reason: e.target.value })}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="modal-status">Status</Label>
                <Select
                  id="modal-status"
                  value={modal.status}
                  onChange={(e) => setModal({ ...modal, status: e.target.value })}
                  disabled={!canEdit}
                >
                  {STATUS_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="modal-notes">Notes</Label>
                <Textarea
                  id="modal-notes"
                  rows={2}
                  placeholder="Optional notes…"
                  value={modal.notes}
                  onChange={(e) => setModal({ ...modal, notes: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
              <div className="flex gap-2">
                {canEdit && (
                  <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
                    {modal.id ? 'Save Changes' : 'Schedule'}
                  </Button>
                )}
                <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                  {canEdit ? 'Cancel' : 'Close'}
                </Button>
              </div>
              {canEdit && modal.id && (
                <button type="button" onClick={handleDelete} disabled={saving} className="px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:text-rose-700">
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
