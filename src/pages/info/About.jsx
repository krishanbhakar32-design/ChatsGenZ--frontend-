import PageLayout from '../../components/PageLayout.jsx'
export default function About() {
  return (
    <PageLayout seo={{
      title: 'About Us — ChatsGenZ Free Live Chat Platform',
      description: 'Learn about ChatsGenZ — the free worldwide live chat platform. Our mission, story, values, and commitment to building a safe global chat community for everyone on ChatsGenZ.',
      keywords: 'about ChatsGenZ, ChatsGenZ mission, free chat platform, ChatsGenZ team, global chat community',
      canonical: '/about',
    }}>
      <div className="page-container">
        <h1 className="page-title">About ChatsGenZ</h1>
        <p className="page-subtitle">Building the most open, free, and friendly live chat community in the world.</p>
        <div className="prose">
          <p><strong>ChatsGenZ</strong> was created with one powerful goal — to give everyone on the planet access to a completely free, safe, and genuinely fun live chat experience. Most chat platforms had become outdated, overly commercial, or unsafe. We wanted to build something better, something people would be proud to use every day.</p>
          <h2>Our Mission</h2>
          <p>Our mission is to provide a completely free live chat platform that connects people worldwide regardless of geography, language, or background. We believe everyone deserves a secure, friendly space to connect, express themselves, and build meaningful relationships online. Whether you want to make new friends, practise a foreign language, find interesting conversations, or simply meet new people, ChatsGenZ was built for you.</p>
          <h2>What Makes ChatsGenZ Different</h2>
          <p>ChatsGenZ offers a comprehensive set of features including real-time public chat rooms, private messaging, HD video and audio calls powered by WebRTC, public cam chat, quiz room games, virtual gifts, a rank and XP rewards system, emoticons, stickers, and much more — all at absolutely zero cost. We are proud to be one of the very few platforms that gives you all of this without requiring a credit card, or even an email address to get started.</p>
          <h2>Our Global Community</h2>
          <p>The ChatsGenZ community spans users from across the globe, with active rooms covering dozens of languages, regions, and interests. Whether you are looking to chat in your native language, discuss movies or music, find a connection, or simply talk with interesting strangers from a different part of the world, ChatsGenZ has a room for you.</p>
          <h2>Safety and Moderation</h2>
          <p>We take user safety extremely seriously. Our trained moderation team works around the clock to ensure all chat rooms remain respectful and safe for everyone. We deploy spam filters, reporting systems, and a structured tiered moderation system to quickly deal with abuse or inappropriate behaviour. Your safety and comfort are our highest priorities.</p>
          <h2>Our Core Values</h2>
          <ul>
            <li><strong>Freedom:</strong> Free access to premium chat features for everyone, with no hidden costs, ever.</li>
            <li><strong>Safety:</strong> Zero tolerance for harassment, abuse, exploitation, or illegal content.</li>
            <li><strong>Community:</strong> Building genuine connections between real people from all walks of life worldwide.</li>
            <li><strong>Innovation:</strong> Continuously improving our platform with new features, better performance, and modern technology.</li>
            <li><strong>Inclusivity:</strong> A welcoming platform for people of all backgrounds, languages, cultures, and identities.</li>
          </ul>
          <p>Thank you for being part of the ChatsGenZ community. We are constantly growing, improving, and listening to our users. Join us today and experience free live chat the way it was always meant to be.</p>
        </div>
      </div>
    </PageLayout>
  )
}
