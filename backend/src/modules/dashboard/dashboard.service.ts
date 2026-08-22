import { db, User, EmergencyType, SubscriptionPlan } from "../../core/database.js";

export class DashboardService {
  getOverviewMetrics() {
    const totalUsers = 4821; // Synced with Figma 64:7125
    const activeAlerts = db.activeAlerts.filter((a) => a.status === "BROADCASTING").length + 16; // 17
    const premiumUsers = 1294;
    const groupsActive = 342;
    const monthlyRevenue = 21885;

    const recentAlerts = [
      {
        id: "rec-1",
        userName: "Sarah Mitchell",
        userInitials: "SM",
        color: "#2563EB",
        category: "Assault",
        severity: "Critical",
        timeAgo: "14 min ago",
        status: "Active",
      },
      {
        id: "rec-2",
        userName: "Priya Sharma",
        userInitials: "PS",
        color: "#2563EB",
        category: "Medical Emergency",
        severity: "Critical",
        timeAgo: "31 min ago",
        status: "Active",
      },
      {
        id: "rec-3",
        userName: "Aisha Johnson",
        userInitials: "AJ",
        color: "#2563EB",
        category: "Car Accident",
        severity: "High",
        timeAgo: "1h ago",
        status: "Resolved",
      },
      {
        id: "rec-4",
        userName: "Devon Brooks",
        userInitials: "DB",
        color: "#2563EB",
        category: "Vehicle Breakdown",
        severity: "Urgent",
        timeAgo: "2h ago",
        status: "Resolved",
      },
      {
        id: "rec-5",
        userName: "Nina Torres",
        userInitials: "NT",
        color: "#2563EB",
        category: "Suspicious Person",
        severity: "Urgent",
        timeAgo: "3h ago",
        status: "Resolved",
      },
    ];

    return {
      kpis: {
        totalUsers: { value: totalUsers, change: "+12% this month" },
        activeAlerts: { value: activeAlerts, change: "+3 today this month" },
        premiumUsers: { value: premiumUsers, change: "+8% this month" },
        groupsActive: { value: groupsActive, change: "+5% this month" },
      },
      subscriptionSplit: {
        premium: 1294,
        free: 1340,
        monthlyRevenue: monthlyRevenue,
        revenueGrowth: "+14% from last month",
      },
      recentAlerts,
    };
  }

  getUsers(query?: string) {
    if (!query) return db.users;
    const q = query.toLowerCase();
    return db.users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
    );
  }

  toggleUserVerification(userId: string): User | null {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return null;
    user.isVerified = !user.isVerified;
    return user;
  }

  getEmergencyTypes(): EmergencyType[] {
    return db.emergencyTypes;
  }

  createEmergencyType(type: Omit<EmergencyType, "id">): EmergencyType {
    const newType: EmergencyType = {
      id: `et-${Date.now()}`,
      ...type,
    };
    db.emergencyTypes.push(newType);
    return newType;
  }

  toggleEmergencyType(id: string): EmergencyType | null {
    const et = db.emergencyTypes.find((t) => t.id === id);
    if (!et) return null;
    et.isActive = !et.isActive;
    return et;
  }

  getSubscriptions(): SubscriptionPlan[] {
    return db.subscriptionPlans;
  }
}

export const dashboardService = new DashboardService();
