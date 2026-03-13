import Link from 'next/link'
import { ArrowRight, MessageSquare, Phone, Mail, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900">YourAI</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 leading-tight">
            Your AI-powered
            <br />
            <span className="text-blue-600">business assistant</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            Handle customer calls, chats, emails, and texts 24/7.
            Manage bookings, send quotes, and grow your business — all powered by AI.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: MessageSquare, title: 'Web Chat', desc: 'AI chat widget for your website that knows your business inside out' },
            { icon: Phone, title: 'Voice Calls', desc: 'Answer every call 24/7 with an AI that sounds natural and helpful' },
            { icon: Mail, title: 'Email & SMS', desc: 'Respond to emails and texts automatically with full context' },
            { icon: Shield, title: 'Owner Control', desc: 'Set boundaries, approve actions, and manage everything from your phone' },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-xl border border-gray-200 p-6">
              <feature.icon className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
