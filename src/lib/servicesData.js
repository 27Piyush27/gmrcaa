














export const servicesData = [
{
  id: "income-tax-filing",
  backendServiceId: "tax",
  icon: "Calculator",
  title: "Income Tax Filing",
  shortDesc: "Complete ITR filing for individuals and businesses",
  description: "Expert assistance in filing your Income Tax Returns with maximum tax savings. We handle all ITR forms including ITR-1 to ITR-7.",
  price: 2999,
  originalPrice: 4999,
  duration: "3-5 business days",
  category: "Tax Services",
  features: [
  "Complete ITR preparation & filing",
  "Tax-saving recommendations",
  "Document verification",
  "E-verification assistance",
  "Form 16 & 26AS reconciliation",
  "Post-filing support"],

  popular: true
},
{
  id: "gst-registration",
  backendServiceId: "tax",
  icon: "FileCheck",
  title: "GST Registration",
  shortDesc: "Quick and hassle-free GST registration",
  description: "Get your GST registration done quickly with our expert guidance. We handle the entire process from application to certificate.",
  price: 1999,
  originalPrice: 2999,
  duration: "5-7 business days",
  category: "GST Services",
  features: [
  "Complete application preparation",
  "Document collection & verification",
  "ARN tracking",
  "GST certificate delivery",
  "Post-registration guidance",
  "Login credentials setup"]

},
{
  id: "gst-return-filing",
  backendServiceId: "tax",
  icon: "Percent",
  title: "GST Return Filing",
  shortDesc: "Monthly, quarterly, and annual GST returns",
  description: "Accurate and timely GST return filing to ensure compliance. We handle GSTR-1, GSTR-3B, and annual returns.",
  price: 999,
  duration: "Same day processing",
  category: "GST Services",
  features: [
  "GSTR-1 filing",
  "GSTR-3B filing",
  "Input tax credit reconciliation",
  "Invoice matching",
  "Late fee computation",
  "Compliance calendar"]

},
{
  id: "company-incorporation",
  backendServiceId: "company-law",
  icon: "Building",
  title: "Company Incorporation",
  shortDesc: "Private Limited, LLP, OPC registration",
  description: "Complete company incorporation services including name approval, MOA/AOA drafting, and registration with MCA.",
  price: 9999,
  originalPrice: 14999,
  duration: "10-15 business days",
  category: "Company Law",
  features: [
  "Name availability check",
  "DSC & DIN procurement",
  "MOA & AOA drafting",
  "MCA filing & registration",
  "PAN & TAN application",
  "Incorporation certificate"],

  popular: true
},
{
  id: "audit-assurance",
  backendServiceId: "auditing",
  icon: "Shield",
  title: "Audit & Assurance",
  shortDesc: "Statutory, internal, and tax audits",
  description: "Comprehensive audit services to ensure financial accuracy and regulatory compliance for your business.",
  price: 15000,
  duration: "2-4 weeks",
  category: "Audit Services",
  features: [
  "Statutory audit",
  "Internal audit",
  "Tax audit",
  "Due diligence",
  "Risk assessment",
  "Management letter"]

},
{
  id: "compliance-services",
  backendServiceId: "company-law",
  icon: "ClipboardCheck",
  title: "Annual Compliance",
  shortDesc: "ROC filings, annual returns, board meetings",
  description: "Stay compliant with all annual regulatory requirements including ROC filings, AGM, and board meeting compliance.",
  price: 7999,
  originalPrice: 9999,
  duration: "Ongoing support",
  category: "Compliance",
  features: [
  "Annual return filing",
  "Director KYC",
  "Board meeting minutes",
  "AGM compliance",
  "Statutory registers",
  "Event-based filings"]

},
{
  id: "tds-compliance",
  backendServiceId: "tax",
  icon: "Percent",
  title: "TDS Compliance",
  shortDesc: "TDS deduction, payment, and return filing",
  description: "Complete TDS management including deduction, payment, quarterly returns, and TDS certificate issuance.",
  price: 2499,
  duration: "Quarterly filing",
  category: "Tax Services",
  features: [
  "TDS computation",
  "Challan preparation",
  "Quarterly TDS returns",
  "Form 16/16A generation",
  "TDS reconciliation",
  "Lower deduction certificate"]

},
{
  id: "payroll-management",
  backendServiceId: "payroll",
  icon: "Users",
  title: "Payroll Management",
  shortDesc: "Complete payroll processing and compliance",
  description: "End-to-end payroll processing including salary computation, PF/ESI compliance, and statutory filings.",
  price: 4999,
  duration: "Monthly service",
  category: "HR & Payroll",
  features: [
  "Salary processing",
  "PF/ESI compliance",
  "Professional tax",
  "Payslip generation",
  "Full & final settlement",
  "Form 16 preparation"]

},
{
  id: "project-finance",
  backendServiceId: "finance-advisory",
  icon: "TrendingUp",
  title: "Project Finance",
  shortDesc: "Business loans, project reports, funding",
  description: "Expert assistance in project financing including detailed project reports, loan documentation, and bank liaison.",
  price: 19999,
  duration: "2-4 weeks",
  category: "Advisory",
  features: [
  "Project report preparation",
  "Financial projections",
  "Loan documentation",
  "Bank liaison",
  "Subsidy applications",
  "Credit appraisal support"]

}];


export const getServiceById = (id) => {
  return servicesData.find((service) => service.id === id);
};