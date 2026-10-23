import LegalPage from '../components/layout/LegalPage'

const SECTIONS = [
  {
    heading: 'What PrettyBooked is',
    paragraphs: [
      'PrettyBooked is a place for students to find stylists and book appointments with them. We are not a party to the appointment. Each stylist is responsible for the services they offer, their prices and the quality of their work.',
      'Payment is not handled on PrettyBooked. Students and stylists agree on payment between themselves.',
    ],
  },
  {
    heading: 'Your account',
    items: [
      'Give your real name and an email address you can check.',
      'Keep your password private. You are responsible for what happens on your account.',
      'Stylists must only list services they can actually provide, at the prices shown.',
    ],
  },
  {
    heading: 'Bookings',
    items: [
      'A booking request is not confirmed until the stylist confirms it.',
      'If you cannot make an appointment, let the other person know through Messages as early as you can.',
    ],
  },
  {
    heading: 'Messages and reviews',
    items: [
      'Be respectful. No harassment, threats, hate speech, spam or explicit content.',
      'Reviews must be honest and based on an appointment you actually had.',
      'Only upload photos you took or have permission to use.',
    ],
  },
  {
    heading: 'Removing content and accounts',
    paragraphs: [
      'We may remove content or close accounts that break these terms or put other users at risk.',
    ],
  },
  {
    heading: 'No guarantees',
    paragraphs: [
      'PrettyBooked is provided as it is. We work to keep it running and accurate, but we cannot promise it will always be available or error free, and we are not responsible for the services stylists provide.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'If we change these terms, we will update the date at the top of this page. Using PrettyBooked after a change means you accept the new terms.',
    ],
  },
]

export default function Terms() {
  return (
    <LegalPage
      title="Terms of use"
      updated="October 22, 2026"
      intro="These terms apply to everyone who uses PrettyBooked, whether you are a student booking an appointment or a stylist offering services. By creating an account, you agree to them."
      sections={SECTIONS}
    />
  )
}
