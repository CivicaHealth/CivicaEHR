async function devEmail(kind: string, to: string | null | undefined) {
  if (process.env.NODE_ENV !== 'production') console.log(`[email:${kind}]`, to ?? 'no-recipient');
}

export const sendWelcomeEmail = (to: string, _name: string) => devEmail('welcome', to);
export const sendClinicRegistrationNotification = (to: string, _clinic: string, _url: string) => devEmail('clinic-registration', to);
export const sendPortalMessageNotification = (to: string, _patient: string) => devEmail('portal-message', to);
export const sendPatientMessageNotification = (to: string | null, _patient: string) => devEmail('patient-message', to);
export const sendLabRequestNotification = (to: string, _patient: string) => devEmail('lab-request', to);
export const sendLabResultNotification = (to: string | null, _patient: string) => devEmail('lab-result', to);
export const sendLabResultReadyNotification = (to: string | null, _url: string) => devEmail('lab-result-ready', to);
export const sendLabReviewNeededNotification = (to: string, _url: string) => devEmail('lab-review-needed', to);
