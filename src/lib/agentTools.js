/**
 * Agentic AI Tools Engine
 * 
 * Each tool has:
 *  - name: unique identifier
 *  - description: what the AI sees to decide when to use it
 *  - parameters: JSON schema of expected params
 *  - requiresConfirmation: if true, the UI shows a confirm card before executing
 *  - roles: which user roles can use this tool
 *  - execute(params, context): async function that performs the action
 */

import { supabase } from "@/integrations/supabase/client";
import { servicesData } from "@/lib/servicesData";
import { resolveServiceIdForDb } from "@/lib/serviceIdResolver";
import { notifyStaff } from "@/lib/notifications";

// ── Tool Definitions ────────────────────────────────────────────────────

export const AGENT_TOOLS = [
  // ─── Client Tools ─────────────────────────────────────────────────
  {
    name: "check_service_status",
    description: "Check the status of a user's active service requests. Use when the user asks about their service status, pending requests, or progress.",
    parameters: { type: "object", properties: {} },
    requiresConfirmation: false,
    roles: ["client", "ca", "admin"],
    execute: async (_params, { userId }) => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, status, progress, created_at, services(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) return { success: false, error: error.message };
      if (!data?.length) return { success: true, data: [], message: "No active service requests found." };

      return {
        success: true,
        data: data.map(r => ({
          service: r.services?.name || "Unknown",
          status: r.status,
          progress: r.progress || 0,
          requestedOn: new Date(r.created_at).toLocaleDateString("en-IN"),
        })),
      };
    },
  },

  {
    name: "get_my_invoices",
    description: "Retrieve the user's invoices/payments. Use when user asks about bills, unpaid invoices, payment history, or receipts.",
    parameters: { type: "object", properties: {} },
    requiresConfirmation: false,
    roles: ["client", "ca", "admin"],
    execute: async (_params, { userId }) => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, status, created_at, services(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) return { success: false, error: error.message };
      if (!data?.length) return { success: true, data: [], message: "No invoices found." };

      const unpaid = data.filter(p => p.status !== "completed" && p.status !== "paid");
      const totalPaid = data
        .filter(p => p.status === "completed" || p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        success: true,
        data: {
          invoices: data.map(p => ({
            service: p.services?.name || "Service",
            amount: `₹${(p.amount || 0).toLocaleString("en-IN")}`,
            status: p.status,
            date: new Date(p.created_at).toLocaleDateString("en-IN"),
          })),
          summary: {
            total: data.length,
            unpaid: unpaid.length,
            totalPaid: `₹${totalPaid.toLocaleString("en-IN")}`,
          },
        },
      };
    },
  },

  {
    name: "request_service",
    description: "Request a CA service on behalf of the user. Use when user explicitly wants to start/request a service like ITR filing, GST registration, company incorporation, etc. Valid service IDs: income-tax-filing, gst-registration, gst-return-filing, company-incorporation, audit-assurance, compliance-services, tds-compliance, payroll-management, project-finance.",
    parameters: {
      type: "object",
      properties: {
        service_id: {
          type: "string",
          description: "The service ID to request",
        },
      },
      required: ["service_id"],
    },
    requiresConfirmation: true,
    roles: ["client", "ca", "admin"],
    execute: async (params, { userId }) => {
      const service = servicesData.find(s => s.id === params.service_id);
      if (!service) return { success: false, error: `Unknown service: ${params.service_id}` };

      const backendServiceId = service.backendServiceId ?? service.id;
      const serviceIdForDb = await resolveServiceIdForDb(backendServiceId, service.title);

      // Check for existing active request
      const { data: existing } = await supabase
        .from("service_requests")
        .select("id, status")
        .eq("user_id", userId)
        .eq("service_id", serviceIdForDb)
        .in("status", ["pending", "in_progress"]);

      if (existing?.length > 0) {
        return { success: false, error: `You already have an active ${service.title} request (status: ${existing[0].status}).` };
      }

      const { error } = await supabase.from("service_requests").insert({
        user_id: userId,
        service_id: serviceIdForDb,
        status: "pending",
        progress: 0,
      });

      if (error) return { success: false, error: error.message };

      notifyStaff(
        "New Service Request",
        `A client requested the ${service.title} service via AI Agent.`,
        "service_update"
      );

      return {
        success: true,
        message: `✅ ${service.title} service requested successfully! Price: ₹${service.price.toLocaleString("en-IN")}. Expected duration: ${service.duration}. Track progress on your Dashboard.`,
      };
    },
  },

  {
    name: "get_upcoming_appointments",
    description: "Get the user's upcoming appointments. Use when user asks about their booked appointments or scheduled meetings.",
    parameters: { type: "object", properties: {} },
    requiresConfirmation: false,
    roles: ["client", "ca", "admin"],
    execute: async (_params, { userId }) => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_type, status, notes")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) return { success: false, error: error.message };
      if (!data?.length) return { success: true, data: [], message: "No upcoming appointments found." };

      const upcoming = data.filter(a => new Date(a.appointment_date || a.date) >= new Date()).sort((a, b) => new Date(a.appointment_date || a.date) - new Date(b.appointment_date || b.date));
      if (!upcoming.length) return { success: true, data: [], message: "No upcoming appointments found." };

      return {
        success: true,
        data: upcoming.map(a => ({
          date: new Date(a.appointment_date || a.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
          time: new Date(a.appointment_date || a.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          type: a.appointment_type || "Consultation",
          status: a.status || "confirmed",
        })),
      };
    },
  },

  {
    name: "calculate_tax",
    description: "Calculate income tax under both old and new regimes. Use when user asks to calculate tax, compare regimes, or mentions their income amount.",
    parameters: {
      type: "object",
      properties: {
        annual_income: {
          type: "number",
          description: "Annual gross income in INR",
        },
        deductions_80c: {
          type: "number",
          description: "Total Section 80C deductions (PPF, ELSS, LIC, etc). Default 0.",
        },
        deductions_80d: {
          type: "number",
          description: "Health insurance premium under Section 80D. Default 0.",
        },
        hra_exemption: {
          type: "number",
          description: "HRA exemption amount. Default 0.",
        },
      },
      required: ["annual_income"],
    },
    requiresConfirmation: false,
    roles: ["client", "ca", "admin"],
    execute: async (params) => {
      const income = Number(params.annual_income) || 0;
      const ded80c = Math.min(Number(params.deductions_80c) || 0, 150000);
      const ded80d = Math.min(Number(params.deductions_80d) || 0, 100000);
      const hra = Number(params.hra_exemption) || 0;

      // Old Regime (with deductions)
      const oldTaxableIncome = Math.max(0, income - 50000 - ded80c - ded80d - hra); // 50k standard deduction
      let oldTax = 0;
      if (oldTaxableIncome > 1000000) oldTax = 12500 + 100000 + (oldTaxableIncome - 1000000) * 0.30;
      else if (oldTaxableIncome > 500000) oldTax = 12500 + (oldTaxableIncome - 500000) * 0.20;
      else if (oldTaxableIncome > 250000) oldTax = (oldTaxableIncome - 250000) * 0.05;
      if (oldTaxableIncome <= 500000) oldTax = 0; // 87A rebate

      // New Regime (FY 2025-26)
      const newTaxableIncome = Math.max(0, income - 75000); // 75k standard deduction, no other deductions
      const slabs = [[400000, 0], [800000, 0.05], [1200000, 0.10], [1600000, 0.15], [2000000, 0.20], [2400000, 0.25], [Infinity, 0.30]];
      let newTax = 0;
      let prev = 0;
      for (const [limit, rate] of slabs) {
        if (newTaxableIncome <= prev) break;
        newTax += (Math.min(newTaxableIncome, limit) - prev) * rate;
        prev = limit;
      }
      if (newTaxableIncome <= 1200000) newTax = 0; // 87A rebate

      oldTax = Math.round(oldTax * 1.04); // 4% cess
      newTax = Math.round(newTax * 1.04);
      const savings = Math.abs(oldTax - newTax);

      return {
        success: true,
        data: {
          income: `₹${income.toLocaleString("en-IN")}`,
          oldRegime: {
            taxableIncome: `₹${oldTaxableIncome.toLocaleString("en-IN")}`,
            tax: `₹${oldTax.toLocaleString("en-IN")}`,
            deductionsClaimed: `₹${(ded80c + ded80d + hra).toLocaleString("en-IN")}`,
          },
          newRegime: {
            taxableIncome: `₹${newTaxableIncome.toLocaleString("en-IN")}`,
            tax: `₹${newTax.toLocaleString("en-IN")}`,
          },
          recommendation: newTax <= oldTax ? "New Regime" : "Old Regime",
          savings: `₹${savings.toLocaleString("en-IN")}`,
        },
      };
    },
  },

  // ─── Admin / CA Tools ─────────────────────────────────────────────
  {
    name: "lookup_client",
    description: "Search for a client by name or email. Admin/CA only. Use when admin asks about a specific client's requests, status, or profile.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Client name or email to search for",
        },
      },
      required: ["query"],
    },
    requiresConfirmation: false,
    roles: ["ca", "admin"],
    execute: async (params) => {
      const q = params.query?.trim();
      if (!q) return { success: false, error: "Please provide a client name or email." };

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(5);

      if (error) return { success: false, error: error.message };
      if (!profiles?.length) return { success: true, data: [], message: `No clients found matching "${q}".` };

      // For each client, get their active service requests
      const results = [];
      for (const profile of profiles) {
        const { data: requests } = await supabase
          .from("service_requests")
          .select("status, created_at, services(name)")
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false })
          .limit(5);

        results.push({
          name: profile.name,
          email: profile.email,
          requests: (requests || []).map(r => ({
            service: r.services?.name || "Unknown",
            status: r.status,
            date: new Date(r.created_at).toLocaleDateString("en-IN"),
          })),
        });
      }

      return { success: true, data: results };
    },
  },

  {
    name: "get_all_pending_requests",
    description: "Get all pending service requests across all clients. Admin/CA only. Use when admin wants to see workload, pending items, or unassigned tasks.",
    parameters: { type: "object", properties: {} },
    requiresConfirmation: false,
    roles: ["ca", "admin"],
    execute: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, status, progress, created_at, services(name), profiles(name, email)")
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: true })
        .limit(20);

      if (error) return { success: false, error: error.message };
      if (!data?.length) return { success: true, data: [], message: "🎉 No pending requests! All caught up." };

      return {
        success: true,
        data: {
          total: data.length,
          pending: data.filter(r => r.status === "pending").length,
          inProgress: data.filter(r => r.status === "in_progress").length,
          requests: data.map(r => ({
            id: r.id,
            client: r.profiles?.name || "Unknown",
            email: r.profiles?.email || "",
            service: r.services?.name || "Unknown",
            status: r.status,
            progress: r.progress || 0,
            date: new Date(r.created_at).toLocaleDateString("en-IN"),
          })),
        },
      };
    },
  },

  {
    name: "update_request_status",
    description: "Update a service request's status. Admin/CA only. Use when admin says to mark/update a request as in_progress, completed, or cancelled.",
    parameters: {
      type: "object",
      properties: {
        request_id: {
          type: "string",
          description: "The service request UUID",
        },
        new_status: {
          type: "string",
          description: "New status: pending, in_progress, completed, or cancelled",
        },
        progress: {
          type: "number",
          description: "Progress percentage (0-100). Optional.",
        },
      },
      required: ["request_id", "new_status"],
    },
    requiresConfirmation: true,
    roles: ["ca", "admin"],
    execute: async (params) => {
      const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
      if (!validStatuses.includes(params.new_status)) {
        return { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` };
      }

      const updateData = { status: params.new_status };
      if (params.progress !== undefined) updateData.progress = params.progress;
      if (params.new_status === "completed") updateData.progress = 100;

      const { error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", params.request_id);

      if (error) return { success: false, error: error.message };

      return { success: true, message: `✅ Request updated to "${params.new_status}"${params.progress ? ` (${params.progress}%)` : ""}.` };
    },
  },

  {
    name: "get_revenue_summary",
    description: "Get revenue/payment summary for the firm. Admin/CA only. Use when admin asks about revenue, income, earnings, monthly summary, or financial overview.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Time period: 'this_month', 'last_month', 'this_year', or 'all'. Default: 'this_month'.",
        },
      },
    },
    requiresConfirmation: false,
    roles: ["ca", "admin"],
    execute: async (params) => {
      const period = params.period || "this_month";
      const now = new Date();
      let dateFilter;

      if (period === "this_month") {
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      } else if (period === "last_month") {
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      } else if (period === "this_year") {
        dateFilter = new Date(now.getFullYear(), 0, 1).toISOString();
      } else {
        dateFilter = null;
      }

      let query = supabase
        .from("payments")
        .select("amount, status, created_at, services(name)")
        .in("status", ["completed", "paid"]);

      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }

      const { data, error } = await query;

      if (error) return { success: false, error: error.message };

      const total = (data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const byService = {};
      (data || []).forEach(p => {
        const svcName = p.services?.name || "Other";
        byService[svcName] = (byService[svcName] || 0) + (p.amount || 0);
      });

      return {
        success: true,
        data: {
          period: period.replace("_", " "),
          totalRevenue: `₹${total.toLocaleString("en-IN")}`,
          transactionCount: data?.length || 0,
          byService: Object.entries(byService).map(([name, amount]) => ({
            service: name,
            revenue: `₹${amount.toLocaleString("en-IN")}`,
          })),
        },
      };
    },
  },

  {
    name: "get_client_count",
    description: "Get the total number of clients. Admin/CA only. Use when admin asks how many clients, users, or customers they have.",
    parameters: { type: "object", properties: {} },
    requiresConfirmation: false,
    roles: ["ca", "admin"],
    execute: async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client");

      if (error) return { success: false, error: error.message };

      return {
        success: true,
        data: { totalClients: count || 0 },
        message: `You currently have ${count || 0} registered clients.`,
      };
    },
  },
];

// ── Helper: Get tools available for a specific role ────────────────────
export function getToolsForRole(role) {
  return AGENT_TOOLS.filter(t => t.roles.includes(role || "client"));
}

// ── Helper: Generate tool descriptions for the AI system prompt ────────
export function getToolPrompt(role) {
  const tools = getToolsForRole(role);
  const toolDocs = tools.map(t => {
    const paramDesc = t.parameters?.properties
      ? Object.entries(t.parameters.properties)
          .map(([k, v]) => `    - ${k} (${v.type}): ${v.description}`)
          .join("\n")
      : "    (no parameters)";
    const required = t.parameters?.required?.length
      ? `  Required: ${t.parameters.required.join(", ")}`
      : "";
    return `- **${t.name}**: ${t.description}\n  Parameters:\n${paramDesc}\n${required}`;
  }).join("\n\n");

  return `
AGENTIC AI TOOLS:
You have access to the following tools to take actions on behalf of the user.
To call a tool, output EXACTLY this format on its own line:
[TOOL_CALL:tool_name({"param1":"value1","param2":"value2"})]

IMPORTANT RULES:
1. You may call MULTIPLE tools in one response if needed.
2. Each [TOOL_CALL:...] must be on its own line.
3. After outputting a tool call, STOP writing — the system will execute the tool, feed the result back to you, and you will then summarize the result in natural language.
4. For tools that require confirmation (request_service, update_request_status), the system will show a confirmation card to the user before executing.
5. Only use tools when the user's intent clearly matches. Don't force tool calls.
6. Parameter values must be valid JSON inside the parentheses.

AVAILABLE TOOLS:
${toolDocs}
`;
}

// ── Execute a tool by name ─────────────────────────────────────────────
export async function executeTool(toolName, params, context) {
  const tool = AGENT_TOOLS.find(t => t.name === toolName);
  if (!tool) return { success: false, error: `Unknown tool: ${toolName}` };

  // Role check
  if (!tool.roles.includes(context.role || "client")) {
    return { success: false, error: "You don't have permission to use this tool." };
  }

  try {
    return await tool.execute(params, context);
  } catch (err) {
    console.error(`Tool ${toolName} execution error:`, err);
    return { success: false, error: `Tool execution failed: ${err.message}` };
  }
}

// ── Parse tool calls from AI response text ────────────────────────────
export function parseToolCalls(text) {
  const toolCallRegex = /\[TOOL_CALL:(\w+)\((\{.*?\})\)\]/g;
  const calls = [];
  let match;
  while ((match = toolCallRegex.exec(text)) !== null) {
    try {
      const params = JSON.parse(match[2]);
      calls.push({
        fullMatch: match[0],
        toolName: match[1],
        params,
        tool: AGENT_TOOLS.find(t => t.name === match[1]),
      });
    } catch (e) {
      console.warn("Failed to parse tool call params:", match[0], e);
    }
  }
  return calls;
}

// ── Strip tool calls from displayed text ──────────────────────────────
export function stripToolCalls(text) {
  return text.replace(/\[TOOL_CALL:\w+\(\{.*?\}\)\]/g, "").trim();
}
