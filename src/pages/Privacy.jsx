import LegalPage from '../components/layout/LegalPage'

const SECTIONS = [
  {
    heading: 'What we collect',
    items: [
      'Your account: your name, email address, password and whether you are a student or a stylist. Passwords are stored by our sign-in provider in a scrambled (hashed) form that nobody can read.',
      'Stylist profiles: your bio, category, profile photo, portfolio photos, services, prices and opening hours.',
      'Bookings: who booked, which stylist and service, and the date, time and status.',
      'Messages you send to other users, and reviews students write after a completed appointment.',
      'Notifications we create when a booking changes.',
    ],
  },
  {
    heading: 'Who can see it',
    items: [
      'Anyone visiting the site can see stylist profiles, photos, services, prices, opening hours, reviews and the names of reviewers.',
      'Your email address is never shown to other users.',
      'Bookings are visible only to the student and the stylist involved.',
      'Messages are visible only to the sender and the receiver.',
      'Notifications are visible only to you.',
    ],
  },
  {
    heading: 'How we use it',
    paragraphs: [
      'We use your information only to run PrettyBooked: to sign you in, show stylists to students, handle bookings, deliver messages and notifications, and display reviews. We do not sell your information, show ads, or use tracking or advertising cookies.',
    ],
  },
  {
    heading: 'Services we rely on',
    items: [
      'Supabase stores the database and photos and handles sign-in.',
      'Vercel hosts the website.',
      'Google Fonts provides the fonts. Your browser downloads them from Google, which sees your IP address when it does.',
    ],
  },
  {
    heading: 'Storage in your browser',
    paragraphs: [
      'To keep you logged in, your browser stores a sign-in token on your device. It is removed when you sign out. We do not use cookies for tracking.',
    ],
  },
  {
    heading: 'Your choices',
    paragraphs: [
      'Stylists can change their services and opening hours at any time from the dashboard. To have your account and data deleted, contact the PrettyBooked team and we will remove it.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'If we change this policy, we will update the date at the top of this page.',
    ],
  },
]

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="October 22, 2026"
      intro="PrettyBooked helps students at Grambling State University book beauty and style services with campus stylists. This page explains what information we keep and how we use it."
      sections={SECTIONS}
    />
  )
}
