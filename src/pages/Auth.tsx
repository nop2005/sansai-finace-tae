import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if user has a role
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        if (!userRoles || userRoles.length === 0) {
          // User has no role - redirect to pending approval page
          toast({
            title: "รอการอนุมัติ",
            description: "บัญชีของคุณรอการอนุมัติจากผู้ดูแลระบบ",
            variant: "destructive",
          });
          navigate("/pending-approval");
          return;
        }

        toast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: "ยินดีต้อนรับกลับมา",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "สมัครสมาชิกสำเร็จ",
          description: "กรุณารอการอนุมัติจากผู้ดูแลระบบ",
        });
        
        // Switch to login mode after signup
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div className="flex bg-background rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden max-w-[1000px] w-full">
        {/* Left Panel */}
        <div className="flex-1 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] p-[60px_40px] flex flex-col justify-center items-center text-white relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.1)_0%,transparent_50%)] z-0" />
          
          {/* Floating Coins */}
          <div className="absolute top-[10%] left-[8%] w-20 h-20 bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-full shadow-[0_8px_20px_rgba(255,215,0,0.6),inset_0_-3px_8px_rgba(0,0,0,0.3)] border-[3px] border-[#ffed4e] animate-[float_6s_ease-in-out_infinite] before:content-[''] before:absolute before:top-[15%] before:left-[20%] before:w-[40%] before:h-[30%] before:bg-[radial-gradient(ellipse,rgba(255,255,255,0.8),transparent)] before:rounded-full after:content-['฿'] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:text-[42px] after:font-bold after:text-[#cc8800] after:drop-shadow-[1px_1px_2px_rgba(0,0,0,0.3)]" />
          <div className="absolute top-[55%] left-[12%] w-[65px] h-[65px] bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-full shadow-[0_8px_20px_rgba(255,215,0,0.6),inset_0_-3px_8px_rgba(0,0,0,0.3)] border-[3px] border-[#ffed4e] animate-[float_7s_ease-in-out_infinite_1s] before:content-[''] before:absolute before:top-[15%] before:left-[20%] before:w-[40%] before:h-[30%] before:bg-[radial-gradient(ellipse,rgba(255,255,255,0.8),transparent)] before:rounded-full after:content-['฿'] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:text-[36px] after:font-bold after:text-[#cc8800] after:drop-shadow-[1px_1px_2px_rgba(0,0,0,0.3)]" />
          <div className="absolute top-[25%] right-[10%] w-[70px] h-[70px] bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-full shadow-[0_8px_20px_rgba(255,215,0,0.6),inset_0_-3px_8px_rgba(0,0,0,0.3)] border-[3px] border-[#ffed4e] animate-[float_8s_ease-in-out_infinite_2s] before:content-[''] before:absolute before:top-[15%] before:left-[20%] before:w-[40%] before:h-[30%] before:bg-[radial-gradient(ellipse,rgba(255,255,255,0.8),transparent)] before:rounded-full after:content-['฿'] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:text-[36px] after:font-bold after:text-[#cc8800] after:drop-shadow-[1px_1px_2px_rgba(0,0,0,0.3)]" />
          <div className="absolute bottom-[15%] right-[8%] w-20 h-20 bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-full shadow-[0_8px_20px_rgba(255,215,0,0.6),inset_0_-3px_8px_rgba(0,0,0,0.3)] border-[3px] border-[#ffed4e] animate-[float_6.5s_ease-in-out_infinite_1.5s] before:content-[''] before:absolute before:top-[15%] before:left-[20%] before:w-[40%] before:h-[30%] before:bg-[radial-gradient(ellipse,rgba(255,255,255,0.8),transparent)] before:rounded-full after:content-['฿'] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:text-[42px] after:font-bold after:text-[#cc8800] after:drop-shadow-[1px_1px_2px_rgba(0,0,0,0.3)]" />
          
          {/* Chart SVG */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[180px] opacity-35">
            <svg viewBox="0 0 280 180" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <line x1="20" y1="140" x2="260" y2="140" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5"/>
              <line x1="20" y1="100" x2="260" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5"/>
              <line x1="20" y1="60" x2="260" y2="60" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5"/>
              <path d="M20,150 L60,120 L100,110 L140,70 L180,50 L220,25 L260,20 L260,160 L20,160 Z" fill="url(#areaGradient)"/>
              <polyline points="20,150 60,120 100,110 140,70 180,50 220,25 260,20" stroke="url(#lineGradient)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="150" r="6" fill="white" opacity="0.9"/>
              <circle cx="60" cy="120" r="6" fill="white" opacity="0.9"/>
              <circle cx="100" cy="110" r="6" fill="white" opacity="0.9"/>
              <circle cx="140" cy="70" r="6" fill="white" opacity="0.9"/>
              <circle cx="180" cy="50" r="6" fill="white" opacity="0.9"/>
              <circle cx="220" cy="25" r="6" fill="white" opacity="0.9"/>
              <circle cx="260" cy="20" r="7" fill="white" opacity="1">
                <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite"/>
              </circle>
              <path d="M255,15 L260,5 L265,15" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Logo Section */}
          <div className="text-center z-[2] relative">
            <div className="w-[140px] h-[140px] bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)] p-5">
              <svg viewBox="0 0 200 200" className="w-[85%] h-[85%]">
                <rect x="75" y="50" width="50" height="100" fill="#00a651" rx="5"/>
                <rect x="50" y="75" width="100" height="50" fill="#00a651" rx="5"/>
                <path d="M100 140 C80 120, 70 110, 70 95 C70 80, 80 70, 95 70 C100 70, 105 75, 100 80 C95 75, 100 70, 105 70 C120 70, 130 80, 130 95 C130 110, 120 120, 100 140 Z" fill="#ed1c24"/>
              </svg>
            </div>
            <h1 className="text-[32px] font-bold mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)] z-[2]">โรงพยาบาลสันทราย</h1>
            <p className="text-lg font-normal opacity-95 z-[2]">Sansai Hospital</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-[60px_50px] flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-[28px] font-semibold text-[#2d3748] mb-2">ระบบบัญชีรับจ่าย</h2>
            <p className="text-base text-muted-foreground">
              {isLogin ? "เข้าสู่ระบบเพื่อจัดการข้อมูลทางการเงิน" : "สมัครสมาชิกเพื่อเข้าใช้งานระบบ"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[15px] font-medium text-[#4a5568]">ชื่อ-นามสกุล</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 px-[18px] text-[15px] border-2 border-[#e2e8f0] rounded-[10px] bg-[#f7fafc] focus:border-[#4facfe] focus:bg-white focus:ring-[3px] focus:ring-[rgba(79,172,254,0.1)]"
                  placeholder="กรุณากรอกชื่อ-นามสกุล"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[15px] font-medium text-[#4a5568]">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 px-[18px] text-[15px] border-2 border-[#e2e8f0] rounded-[10px] bg-[#f7fafc] focus:border-[#4facfe] focus:bg-white focus:ring-[3px] focus:ring-[rgba(79,172,254,0.1)]"
                placeholder="กรุณากรอกอีเมลของคุณ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[15px] font-medium text-[#4a5568]">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 px-[18px] text-[15px] border-2 border-[#e2e8f0] rounded-[10px] bg-[#f7fafc] focus:border-[#4facfe] focus:bg-white focus:ring-[3px] focus:ring-[rgba(79,172,254,0.1)]"
                placeholder="กรุณากรอกรหัสผ่าน"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white rounded-[10px] text-[17px] font-semibold shadow-[0_4px_15px_rgba(79,172,254,0.4)] hover:shadow-[0_6px_20px_rgba(79,172,254,0.5)] hover:-translate-y-0.5 transition-all duration-300 mt-2.5" 
              disabled={loading}
            >
              {loading ? "กำลังดำเนินการ..." : isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </Button>
          </form>
          
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[15px] text-[#4facfe] font-medium hover:text-[#3b8fd9] transition-colors duration-300 hover:underline"
            >
              {isLogin ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
