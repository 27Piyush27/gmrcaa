// Initialize sample data for demo purposes
export const initializeSampleData = () => {
  // Initialize users if not exists
  if (!localStorage.getItem("gmr_users_v5")) {
    const sampleUsers = [
    {
      id: "1",
      name: "Demo User",
      email: "demo@example.com",
      password: "demo-placeholder",
      role: "client",
      createdAt: new Date().toISOString()
    }];

    localStorage.setItem("gmr_users_v5", JSON.stringify(sampleUsers));
  }

  // Initialize sample service requests if not exists
  if (!localStorage.getItem("gmr_requests_v5")) {
    const sampleRequests = [
    {
      id: "1",
      userId: "demo@example.com",
      serviceId: "accounting",
      serviceName: "Accounting & Bookkeeping",
      status: "in_progress",
      requestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 65,
      updates: [
      "Initial documents received and reviewed",
      "Monthly processing in progress - 65% complete"]

    },
    {
      id: "2",
      userId: "demo@example.com",
      serviceId: "tax",
      serviceName: "Tax Advisory & Compliance",
      status: "completed",
      requestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 100,
      updates: [
      "Tax assessment completed",
      "All returns filed successfully"]

    }];

    localStorage.setItem("gmr_requests_v5", JSON.stringify(sampleRequests));
  }
};