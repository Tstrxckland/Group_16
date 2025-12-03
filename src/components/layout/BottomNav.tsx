import { Home, Target, BookHeart, Users, Heart, User, UserPlus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDiscreetMode } from "@/hooks/useDiscreetMode";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Target, label: "Challenges", path: "/challenges" },
  { icon: Heart, label: "Calm", path: "/calm" },
  { icon: BookHeart, label: "Journal", path: "/journal" },
  { icon: UserPlus, label: "Friends", path: "/friends" },
  { icon: Users, label: "Community", path: "/community" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const { discreetMode } = useDiscreetMode();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center rounded-xl px-3 py-2 text-xs font-medium transition-all duration-300",
                discreetMode ? "gap-0" : "gap-1",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {!discreetMode && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
