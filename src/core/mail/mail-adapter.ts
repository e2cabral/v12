export type MailMessage = {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
};

export interface MailAdapter {
  send(message: MailMessage): Promise<void>;
}
