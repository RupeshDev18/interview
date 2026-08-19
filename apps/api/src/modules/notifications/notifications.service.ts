import { prisma } from '../../lib/prisma';
import { sendEmail } from '../../lib/mailer';
import { logger } from '../../lib/logger';

export const notificationsService = {
  async sendCandidateInvite(params: {
    candidateEmail: string;
    candidateName: string;
    companyName: string;
    interviewTypeName: string;
    scheduledStart: string;
    timezone: string;
    joinUrl: string;
    userId?: string;
  }) {
    const subject = `Interview Invitation: ${params.interviewTypeName} with ${params.companyName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #18110C; color: #F5EBE6; padding: 24px; border-radius: 12px; border: 1px solid #36271D;">
        <h2 style="color: #F97316; margin-top: 0;">${params.companyName} Interview Invitation</h2>
        <p>Hello <strong>${params.candidateName}</strong>,</p>
        <p>You have been scheduled for an interview: <strong>${params.interviewTypeName}</strong>.</p>
        
        <div style="background: #120B07; border: 1px solid #36271D; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${new Date(params.scheduledStart).toLocaleString()} (${params.timezone})</p>
          <p style="margin: 4px 0;"><strong>Format:</strong> Online Video Interview</p>
        </div>

        <p>No login or account is required to join. When it's time for your session, click the link below:</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.joinUrl}" style="background: linear-gradient(135deg, #F97316, #DC2626); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">
            Join Interview Room
          </a>
        </div>

        <p style="color: #A8A29E; font-size: 12px; margin-top: 24px;">
          Direct link: <a href="${params.joinUrl}" style="color: #FBBF24;">${params.joinUrl}</a>
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: params.candidateEmail,
        subject,
        html,
      });

      await prisma.notification.create({
        data: {
          recipient: params.candidateEmail,
          userId: params.userId,
          type: 'INTERVIEW_INVITATION',
          subject,
          body: html,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      logger.info('Candidate invitation email sent', { to: params.candidateEmail });
    } catch (err: any) {
      await prisma.notification.create({
        data: {
          recipient: params.candidateEmail,
          userId: params.userId,
          type: 'INTERVIEW_INVITATION',
          subject,
          body: html,
          status: 'FAILED',
          failureReason: err?.message,
        },
      });
      logger.warn('Failed to send candidate email', { error: err });
    }
  },

  async sendInterviewerNotice(params: {
    interviewerEmail: string;
    interviewerName: string;
    candidateName: string;
    interviewTypeName: string;
    scheduledStart: string;
    timezone: string;
    meetingUrl: string;
    userId?: string;
  }) {
    const subject = `Scheduled Interview: ${params.candidateName} (${params.interviewTypeName})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #18110C; color: #F5EBE6; padding: 24px; border-radius: 12px; border: 1px solid #36271D;">
        <h2 style="color: #F97316; margin-top: 0;">New Interview Scheduled</h2>
        <p>Hello <strong>${params.interviewerName}</strong>,</p>
        <p>You have been assigned to conduct an interview with candidate <strong>${params.candidateName}</strong>.</p>
        
        <div style="background: #120B07; border: 1px solid #36271D; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Type:</strong> ${params.interviewTypeName}</p>
          <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${new Date(params.scheduledStart).toLocaleString()} (${params.timezone})</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.meetingUrl}" style="background: linear-gradient(135deg, #F97316, #DC2626); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">
            Open Interview Room & Notes
          </a>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: params.interviewerEmail,
        subject,
        html,
      });

      await prisma.notification.create({
        data: {
          recipient: params.interviewerEmail,
          userId: params.userId,
          type: 'INTERVIEWER_NOTICE',
          subject,
          body: html,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (err: any) {
      await prisma.notification.create({
        data: {
          recipient: params.interviewerEmail,
          userId: params.userId,
          type: 'INTERVIEWER_NOTICE',
          subject,
          body: html,
          status: 'FAILED',
          failureReason: err?.message,
        },
      });
    }
  },
};
