// Advanced template generator that doesn't require AI
// Parses user prompt for keywords and generates appropriate HTML

interface TemplateConfig {
  theme: string;
  colors: { primary: string; secondary: string; accent: string };
  sections: string[];
  features: string[];
  style: string;
}

export function generateWebsiteFromTemplate(prompt: string, theme: string): string {
  const config = analyzePrompt(prompt, theme);
  return buildHTML(config, prompt);
}

function analyzePrompt(prompt: string, theme: string): TemplateConfig {
  const lowerPrompt = prompt.toLowerCase();

  // Theme-based colors
  const themeColors: Record<string, { primary: string; secondary: string; accent: string }> = {
    portfolio: { primary: "#8B5CF6", secondary: "#EC4899", accent: "#F59E0B" },
    tech: { primary: "#3B82F6", secondary: "#06B6D4", accent: "#8B5CF6" },
    ecommerce: { primary: "#10B981", secondary: "#F59E0B", accent: "#EF4444" },
    blog: { primary: "#EF4444", secondary: "#F97316", accent: "#EC4899" },
    saas: { primary: "#6366F1", secondary: "#8B5CF6", accent: "#06B6D4" },
  };

  // Detect sections from prompt
  const sections: string[] = ["hero"];
  if (lowerPrompt.includes("about") || lowerPrompt.includes("story")) sections.push("about");
  if (lowerPrompt.includes("feature") || lowerPrompt.includes("service")) sections.push("features");
  if (lowerPrompt.includes("pricing") || lowerPrompt.includes("plan")) sections.push("pricing");
  if (lowerPrompt.includes("team") || lowerPrompt.includes("member")) sections.push("team");
  if (lowerPrompt.includes("gallery") || lowerPrompt.includes("portfolio") || lowerPrompt.includes("work")) sections.push("gallery");
  if (lowerPrompt.includes("testimonial") || lowerPrompt.includes("review")) sections.push("testimonials");
  if (lowerPrompt.includes("contact") || lowerPrompt.includes("form")) sections.push("contact");
  if (lowerPrompt.includes("faq") || lowerPrompt.includes("question")) sections.push("faq");
  
  // If no specific sections detected, add default ones
  if (sections.length === 1) {
    sections.push("features", "contact");
  }

  // Detect features
  const features: string[] = [];
  if (lowerPrompt.includes("responsive")) features.push("responsive");
  if (lowerPrompt.includes("modern")) features.push("modern");
  if (lowerPrompt.includes("minimal")) features.push("minimal");
  if (lowerPrompt.includes("animation")) features.push("animated");
  if (lowerPrompt.includes("dark")) features.push("darkMode");

  // Detect style
  let style = "modern";
  if (lowerPrompt.includes("minimal") || lowerPrompt.includes("clean")) style = "minimal";
  if (lowerPrompt.includes("bold") || lowerPrompt.includes("vibrant")) style = "bold";
  if (lowerPrompt.includes("elegant") || lowerPrompt.includes("luxury")) style = "elegant";

  return {
    theme,
    colors: themeColors[theme] || themeColors.portfolio,
    sections,
    features,
    style,
  };
}

function buildHTML(config: TemplateConfig, prompt: string): string {
  const { colors, sections } = config;
  
  const sectionHTML = sections.map(section => {
    switch (section) {
      case "hero":
        return buildHeroSection(colors, prompt);
      case "about":
        return buildAboutSection(colors);
      case "features":
        return buildFeaturesSection(colors);
      case "pricing":
        return buildPricingSection(colors);
      case "team":
        return buildTeamSection(colors);
      case "gallery":
        return buildGallerySection(colors);
      case "testimonials":
        return buildTestimonialsSection(colors);
      case "contact":
        return buildContactSection(colors);
      case "faq":
        return buildFAQSection(colors);
      default:
        return "";
    }
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.theme.charAt(0).toUpperCase() + config.theme.slice(1)} Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .gradient-text {
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
        }
    </style>
</head>
<body class="bg-gray-50">
    ${buildHeader(colors, config.theme)}
    ${sectionHTML}
    ${buildFooter(colors, config.theme)}
</body>
</html>`;
}

function buildHeader(colors: any, theme: string): string {
  return `
    <header class="bg-white shadow-sm sticky top-0 z-50 backdrop-blur-lg bg-white/90">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                    <span class="text-2xl font-bold" style="color: ${colors.primary}">${theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                </div>
                <div class="hidden md:flex space-x-8">
                    <a href="#home" class="text-gray-700 hover:text-gray-900 transition">Home</a>
                    <a href="#about" class="text-gray-700 hover:text-gray-900 transition">About</a>
                    <a href="#services" class="text-gray-700 hover:text-gray-900 transition">Services</a>
                    <a href="#contact" class="text-gray-700 hover:text-gray-900 transition">Contact</a>
                </div>
                <button class="px-6 py-2.5 rounded-lg text-white font-medium hover:shadow-lg transition-all" style="background: ${colors.primary}">
                    Get Started
                </button>
            </div>
        </nav>
    </header>`;
}

function buildHeroSection(colors: any, prompt: string): string {
  const title = prompt.length > 60 ? prompt.slice(0, 60) + "..." : prompt;
  return `
    <section id="home" class="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div class="absolute inset-0 opacity-10">
            <div class="absolute top-20 left-20 w-72 h-72 rounded-full" style="background: ${colors.primary}; filter: blur(100px);"></div>
            <div class="absolute bottom-20 right-20 w-96 h-96 rounded-full" style="background: ${colors.secondary}; filter: blur(100px);"></div>
        </div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div class="text-center animate-fade-in-up">
                <h1 class="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                    ${title}
                </h1>
                <p class="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
                    Transform your digital presence with cutting-edge solutions designed for the modern web
                </p>
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                    <button class="px-10 py-4 rounded-xl text-white text-lg font-semibold hover:shadow-2xl transition-all transform hover:-translate-y-1" style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);">
                        Get Started Now
                    </button>
                    <button class="px-10 py-4 rounded-xl border-2 text-lg font-semibold hover:shadow-lg transition-all" style="border-color: ${colors.primary}; color: ${colors.primary}">
                        Watch Demo
                    </button>
                </div>
            </div>
        </div>
    </section>`;
}

function buildAboutSection(colors: any): string {
  return `
    <section id="about" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 class="text-4xl md:text-5xl font-bold mb-6">About Our Mission</h2>
                    <p class="text-lg text-gray-600 mb-4">
                        We're dedicated to delivering exceptional experiences that push the boundaries of what's possible on the web.
                    </p>
                    <p class="text-lg text-gray-600 mb-6">
                        Our team combines creativity with technical expertise to craft solutions that not only meet but exceed expectations.
                    </p>
                    <button class="px-8 py-3 rounded-lg text-white font-medium" style="background: ${colors.primary}">
                        Learn More
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-gray-50 p-6 rounded-xl">
                        <h3 class="text-4xl font-bold mb-2" style="color: ${colors.primary}">500+</h3>
                        <p class="text-gray-600">Projects Completed</p>
                    </div>
                    <div class="bg-gray-50 p-6 rounded-xl">
                        <h3 class="text-4xl font-bold mb-2" style="color: ${colors.secondary}">98%</h3>
                        <p class="text-gray-600">Client Satisfaction</p>
                    </div>
                    <div class="bg-gray-50 p-6 rounded-xl">
                        <h3 class="text-4xl font-bold mb-2" style="color: ${colors.primary}">50+</h3>
                        <p class="text-gray-600">Team Members</p>
                    </div>
                    <div class="bg-gray-50 p-6 rounded-xl">
                        <h3 class="text-4xl font-bold mb-2" style="color: ${colors.secondary}">24/7</h3>
                        <p class="text-gray-600">Support Available</p>
                    </div>
                </div>
            </div>
        </div>
    </section>`;
}

function buildFeaturesSection(colors: any): string {
  const features = [
    { icon: "⚡", title: "Lightning Fast", desc: "Optimized performance for blazing fast load times" },
    { icon: "🎨", title: "Beautiful Design", desc: "Carefully crafted interfaces that users love" },
    { icon: "🔒", title: "Secure & Safe", desc: "Enterprise-grade security for your peace of mind" },
    { icon: "📱", title: "Fully Responsive", desc: "Perfect experience on any device or screen size" },
    { icon: "🚀", title: "Easy to Use", desc: "Intuitive interface designed for everyone" },
    { icon: "💡", title: "Innovative", desc: "Cutting-edge technology and modern solutions" },
  ];

  return `
    <section id="services" class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                    Everything you need to build amazing experiences
                </p>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${features.map((feature, i) => `
                    <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100">
                        <div class="text-5xl mb-4">${feature.icon}</div>
                        <h3 class="text-2xl font-bold mb-3">${feature.title}</h3>
                        <p class="text-gray-600">${feature.desc}</p>
                    </div>
                `).join("")}
            </div>
        </div>
    </section>`;
}

function buildPricingSection(colors: any): string {
  return `
    <section id="pricing" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
                <p class="text-xl text-gray-600">Choose the perfect plan for your needs</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-gray-50 p-8 rounded-2xl">
                    <h3 class="text-2xl font-bold mb-2">Starter</h3>
                    <p class="text-gray-600 mb-6">Perfect for individuals</p>
                    <div class="mb-6">
                        <span class="text-5xl font-bold">$29</span>
                        <span class="text-gray-600">/month</span>
                    </div>
                    <ul class="space-y-3 mb-8">
                        <li class="flex items-center gap-2">✓ 5 Projects</li>
                        <li class="flex items-center gap-2">✓ Basic Support</li>
                        <li class="flex items-center gap-2">✓ 10GB Storage</li>
                    </ul>
                    <button class="w-full px-6 py-3 rounded-lg border-2 font-medium" style="border-color: ${colors.primary}; color: ${colors.primary}">
                        Get Started
                    </button>
                </div>
                <div class="bg-white p-8 rounded-2xl border-2 shadow-xl transform scale-105" style="border-color: ${colors.primary}">
                    <div class="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white mb-4" style="background: ${colors.primary}">
                        Popular
                    </div>
                    <h3 class="text-2xl font-bold mb-2">Pro</h3>
                    <p class="text-gray-600 mb-6">For growing businesses</p>
                    <div class="mb-6">
                        <span class="text-5xl font-bold">$99</span>
                        <span class="text-gray-600">/month</span>
                    </div>
                    <ul class="space-y-3 mb-8">
                        <li class="flex items-center gap-2">✓ Unlimited Projects</li>
                        <li class="flex items-center gap-2">✓ Priority Support</li>
                        <li class="flex items-center gap-2">✓ 100GB Storage</li>
                        <li class="flex items-center gap-2">✓ Advanced Analytics</li>
                    </ul>
                    <button class="w-full px-6 py-3 rounded-lg text-white font-medium" style="background: ${colors.primary}">
                        Get Started
                    </button>
                </div>
                <div class="bg-gray-50 p-8 rounded-2xl">
                    <h3 class="text-2xl font-bold mb-2">Enterprise</h3>
                    <p class="text-gray-600 mb-6">For large organizations</p>
                    <div class="mb-6">
                        <span class="text-5xl font-bold">$299</span>
                        <span class="text-gray-600">/month</span>
                    </div>
                    <ul class="space-y-3 mb-8">
                        <li class="flex items-center gap-2">✓ Everything in Pro</li>
                        <li class="flex items-center gap-2">✓ 24/7 Support</li>
                        <li class="flex items-center gap-2">✓ Unlimited Storage</li>
                        <li class="flex items-center gap-2">✓ Custom Integration</li>
                    </ul>
                    <button class="w-full px-6 py-3 rounded-lg border-2 font-medium" style="border-color: ${colors.primary}; color: ${colors.primary}">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    </section>`;
}

function buildTeamSection(colors: any): string {
  const team = [
    { name: "Alex Johnson", role: "CEO & Founder", img: "👨‍💼" },
    { name: "Sarah Chen", role: "Lead Designer", img: "👩‍🎨" },
    { name: "Mike Davis", role: "CTO", img: "👨‍💻" },
    { name: "Emily Brown", role: "Marketing Director", img: "👩‍💼" },
  ];

  return `
    <section id="team" class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold mb-4">Meet Our Team</h2>
                <p class="text-xl text-gray-600">The talented people behind our success</p>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                ${team.map(member => `
                    <div class="bg-white p-6 rounded-2xl text-center hover:shadow-xl transition-all">
                        <div class="text-7xl mb-4">${member.img}</div>
                        <h3 class="text-xl font-bold mb-1">${member.name}</h3>
                        <p class="text-gray-600">${member.role}</p>
                    </div>
                `).join("")}
            </div>
        </div>
    </section>`;
}

function buildGallerySection(colors: any): string {
  return `
    <section id="gallery" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold mb-4">Our Work</h2>
                <p class="text-xl text-gray-600">A showcase of our best projects</p>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${[1,2,3,4,5,6].map(i => `
                    <div class="aspect-video bg-gradient-to-br rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, ${colors.primary}${i % 2 === 0 ? '40' : '20'} 0%, ${colors.secondary}${i % 2 === 0 ? '20' : '40'} 100%);">
                        <div class="w-full h-full flex items-center justify-center">
                            <div class="text-center text-white p-6">
                                <h3 class="text-2xl font-bold mb-2">Project ${i}</h3>
                                <p>Click to view details</p>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    </section>`;
}

function buildTestimonialsSection(colors: any): string {
  const testimonials = [
    { name: "John Smith", company: "Tech Corp", text: "Absolutely amazing service! They transformed our vision into reality." },
    { name: "Lisa Wang", company: "StartupXYZ", text: "Professional, creative, and delivered beyond our expectations." },
    { name: "David Miller", company: "Enterprise Inc", text: "The best team we've worked with. Highly recommended!" },
  ];

  return `
    <section id="testimonials" class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold mb-4">What Clients Say</h2>
                <p class="text-xl text-gray-600">Don't just take our word for it</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                ${testimonials.map(t => `
                    <div class="bg-white p-8 rounded-2xl shadow-sm">
                        <div class="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
                        <p class="text-gray-700 mb-6 text-lg">"${t.text}"</p>
                        <div>
                            <p class="font-bold">${t.name}</p>
                            <p class="text-gray-600">${t.company}</p>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    </section>`;
}

function buildContactSection(colors: any): string {
  return `
    <section id="contact" class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h2 class="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h2>
                <p class="text-xl text-gray-600">We'd love to hear from you</p>
            </div>
            <div class="bg-gray-50 p-8 md:p-12 rounded-2xl">
                <form class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">Name</label>
                            <input type="text" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent" style="outline-color: ${colors.primary}" placeholder="Your name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Email</label>
                            <input type="email" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent" style="outline-color: ${colors.primary}" placeholder="your@email.com">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Message</label>
                        <textarea rows="5" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent" style="outline-color: ${colors.primary}" placeholder="Tell us about your project..."></textarea>
                    </div>
                    <button type="submit" class="w-full px-8 py-4 rounded-lg text-white text-lg font-semibold hover:shadow-lg transition-all" style="background: ${colors.primary}">
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    </section>`;
}

function buildFAQSection(colors: any): string {
  const faqs = [
    { q: "How long does it take?", a: "Most projects are completed within 2-4 weeks depending on complexity." },
    { q: "What's included?", a: "Full design, development, testing, and deployment with ongoing support." },
    { q: "Can I request changes?", a: "Absolutely! We offer unlimited revisions until you're 100% satisfied." },
    { q: "Do you offer support?", a: "Yes, we provide 24/7 support for all our clients." },
  ];

  return `
    <section id="faq" class="py-20 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h2 class="text-4xl md:text-5xl font-bold mb-4">FAQ</h2>
                <p class="text-xl text-gray-600">Frequently Asked Questions</p>
            </div>
            <div class="space-y-4">
                ${faqs.map(faq => `
                    <details class="bg-white p-6 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all">
                        <summary class="font-bold text-lg list-none flex justify-between items-center">
                            ${faq.q}
                            <span class="text-2xl" style="color: ${colors.primary}">+</span>
                        </summary>
                        <p class="mt-4 text-gray-600">${faq.a}</p>
                    </details>
                `).join("")}
            </div>
        </div>
    </section>`;
}

function buildFooter(colors: any, theme: string): string {
  return `
    <footer class="bg-gray-900 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                    <h3 class="text-2xl font-bold mb-4" style="color: ${colors.primary}">
                        ${theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </h3>
                    <p class="text-gray-400 mb-4">Building the future, one website at a time.</p>
                    <div class="flex gap-4">
                        <a href="#" class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition">
                            <span>f</span>
                        </a>
                        <a href="#" class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition">
                            <span>𝕏</span>
                        </a>
                        <a href="#" class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition">
                            <span>in</span>
                        </a>
                    </div>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg">Product</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white transition">Features</a></li>
                        <li><a href="#" class="hover:text-white transition">Pricing</a></li>
                        <li><a href="#" class="hover:text-white transition">FAQ</a></li>
                        <li><a href="#" class="hover:text-white transition">Support</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg">Company</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white transition">About</a></li>
                        <li><a href="#" class="hover:text-white transition">Blog</a></li>
                        <li><a href="#" class="hover:text-white transition">Careers</a></li>
                        <li><a href="#" class="hover:text-white transition">Press</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg">Legal</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white transition">Privacy</a></li>
                        <li><a href="#" class="hover:text-white transition">Terms</a></li>
                        <li><a href="#" class="hover:text-white transition">Security</a></li>
                        <li><a href="#" class="hover:text-white transition">Contact</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
                <p>&copy; 2025 Generated with AI React Website Generator. All rights reserved.</p>
            </div>
        </div>
    </footer>`;
}
