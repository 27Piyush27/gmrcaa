import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Home } from "lucide-react";

const easing = [0.22, 1, 0.36, 1];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-accent/[0.06] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-[60px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[50px] pointer-events-none" />
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-30" />

      <div className="text-center relative z-10 px-6">
        {/* Large 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: easing }}>
          
          <motion.h1
            className="text-[10rem] md:text-[14rem] font-bold leading-none gradient-text-premium select-none"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            
            404
          </motion.h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: easing }}
          className="max-w-md mx-auto">
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 tracking-tight">
            Page not found
          </h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: easing }}
          className="flex flex-col sm:flex-row gap-3 justify-center">
          
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button
              asChild
              size="lg"
              className="h-12 px-8 rounded-full bg-foreground text-background font-medium gap-2 shadow-lg hover-lift">
              
              <Link to="/">
                <Home className="w-4 h-4" />
                Return Home
              </Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-8 rounded-full font-medium gap-2 border-border/60 hover-lift">
              
              <Link to="/contact">
                Get Help
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>);

};

export default NotFound;