
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-6">
          <Shield className="w-10 h-10 text-purple-600" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
          Welcome to <span className="text-purple-600">Safe Net</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          AI-powered content moderation that protects public platforms from violent speech,
          threatening gestures, and visually violent content.
        </p>
        <Link to="/login">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg rounded-lg flex items-center gap-2">
            Get Started <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">Powerful AI Moderation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Detect Violent Language</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Our AI automatically identifies violent language in captions, transcripts, and spoken dialogue.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Analyze Visual Content</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Detect threatening gestures, weapons, blood, aggression, or other visual violence in videos and images.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Cross-Check Content</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Automatically cross-check hashtags or captions for known flagged patterns or incitement.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <Card className="border-0 bg-purple-600 text-white w-full max-w-4xl">
          <CardContent className="p-10">
            <h3 className="text-2xl font-bold mb-4">Ready to protect your platform?</h3>
            <p className="mb-8">Start using Safe Net today and keep your content safe for all viewers.</p>
            <Link to="/login">
              <Button variant="outline" className="bg-white text-purple-600 hover:bg-gray-100 px-8">
                Get Started Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
