import {
  normalizePlanId,
  hasFeatureAccess,
  getPlanLimits,
  canAddStaff,
  canAddOutlet,
  canAddTerminal,
  canAddProduct,
  isLanguageAllowed,
  FEATURE_REGISTRY,
  DEFAULT_PLAN_LIMITS,
  PLAN_PRICING,
} from '../src/lib/planAccess';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  error?: string;
}

const results: TestResult[] = [];

function assert(suite: string, test: string, condition: boolean, expected?: any, actual?: any) {
  results.push({
    suite,
    test,
    passed: condition,
    expected,
    actual,
  });
  if (condition) {
    console.log(`  ✓ [${suite}] ${test}`);
  } else {
    console.error(`  ✗ [${suite}] ${test} | Expected: ${expected}, Actual: ${actual}`);
  }
}

console.log('\n========================================================');
console.log('OURSELL PLAN-BASED ACCESS & FUNCTIONALITY TEST SUITE');
console.log('========================================================\n');

// ========================================================
// 1. STARTER PLAN TESTS
// ========================================================
console.log('--- 1. Testing STARTER Tier (₹0/mo) ---');
const starterLimits = DEFAULT_PLAN_LIMITS.starter;
assert('Starter Limits', 'Staff limit is 1', starterLimits.staff === 1, 1, starterLimits.staff);
assert('Starter Limits', 'Outlet limit is 1', starterLimits.outlets === 1, 1, starterLimits.outlets);
assert('Starter Limits', 'Terminal limit is 2', starterLimits.terminals === 2, 2, starterLimits.terminals);
assert('Starter Limits', 'Product limit is 1000', starterLimits.products === 1000, 1000, starterLimits.products);
assert('Starter Pricing', 'Monthly price is ₹0', PLAN_PRICING.starter.monthly === 0, 0, PLAN_PRICING.starter.monthly);

// Starter Enabled Features
assert('Starter Features', 'POS Billing allowed', hasFeatureAccess('starter', 'pos_billing'), true);
assert('Starter Features', 'Offline Billing allowed', hasFeatureAccess('starter', 'offline_billing'), true);
assert('Starter Features', 'Barcode Studio allowed', hasFeatureAccess('starter', 'barcode_studio'), true);
assert('Starter Features', '80mm Thermal Receipts allowed', hasFeatureAccess('starter', 'thermal_receipts'), true);
assert('Starter Features', 'Product Management allowed', hasFeatureAccess('starter', 'product_management'), true);
assert('Starter Features', 'Basic Inventory allowed', hasFeatureAccess('starter', 'basic_inventory'), true);
assert('Starter Features', 'Customer Management allowed', hasFeatureAccess('starter', 'customer_management'), true);
assert('Starter Features', 'Basic Reports allowed', hasFeatureAccess('starter', 'basic_reports'), true);
assert('Starter Features', 'English Language allowed', isLanguageAllowed('en', 'starter').allowed, true);

// Starter Blocked Features
assert('Starter Restrictions', 'Customer Khata BLOCKED', !hasFeatureAccess('starter', 'customer_khata'), false);
assert('Starter Restrictions', 'Purchase Orders BLOCKED', !hasFeatureAccess('starter', 'purchase_orders'), false);
assert('Starter Restrictions', 'Supplier Management BLOCKED', !hasFeatureAccess('starter', 'supplier_management'), false);
assert('Starter Restrictions', 'Expense Management BLOCKED', !hasFeatureAccess('starter', 'expense_management'), false);
assert('Starter Restrictions', 'Advanced Analytics BLOCKED', !hasFeatureAccess('starter', 'advanced_analytics'), false);
assert('Starter Restrictions', 'Multi-Outlet BLOCKED', !hasFeatureAccess('starter', 'multi_outlet'), false);
assert('Starter Restrictions', 'Fleet Management BLOCKED', !hasFeatureAccess('starter', 'fleet_management'), false);
assert('Starter Restrictions', 'Dedicated DB BLOCKED', !hasFeatureAccess('starter', 'dedicated_db'), false);
assert('Starter Restrictions', 'Custom Domain BLOCKED', !hasFeatureAccess('starter', 'custom_domain'), false);
assert('Starter Restrictions', 'Malayalam Language BLOCKED', !isLanguageAllowed('ml', 'starter').allowed, false);
assert('Starter Restrictions', 'Arabic Language BLOCKED', !isLanguageAllowed('ar', 'starter').allowed, false);

// Starter Resource Capacity Checks
assert('Starter Capacity', '1st staff allowed', canAddStaff(0, 'starter').allowed, true);
assert('Starter Capacity', '2nd staff BLOCKED', !canAddStaff(1, 'starter').allowed, false);
assert('Starter Capacity', '1st outlet allowed', canAddOutlet(0, 'starter').allowed, true);
assert('Starter Capacity', '2nd outlet BLOCKED', !canAddOutlet(1, 'starter').allowed, false);
assert('Starter Capacity', '2nd terminal allowed', canAddTerminal(1, 'starter').allowed, true);
assert('Starter Capacity', '3rd terminal BLOCKED', !canAddTerminal(2, 'starter').allowed, false);
assert('Starter Capacity', '1,000th product allowed', canAddProduct(999, 'starter').allowed, true);
assert('Starter Capacity', '1,001st product BLOCKED', !canAddProduct(1000, 'starter').allowed, false);

// ========================================================
// 2. PROFESSIONAL PLAN TESTS
// ========================================================
console.log('\n--- 2. Testing PROFESSIONAL Tier (₹799/mo) ---');
const proLimits = DEFAULT_PLAN_LIMITS.professional;
assert('Pro Limits', 'Staff limit is 3', proLimits.staff === 3, 3, proLimits.staff);
assert('Pro Limits', 'Outlet limit is 3', proLimits.outlets === 3, 3, proLimits.outlets);
assert('Pro Limits', 'Terminal limit is 6', proLimits.terminals === 6, 6, proLimits.terminals);
assert('Pro Limits', 'Product limit is Unlimited (null)', proLimits.products === null, null, proLimits.products);
assert('Pro Pricing', 'Monthly price is ₹799', PLAN_PRICING.professional.monthly === 799, 799, PLAN_PRICING.professional.monthly);

// Pro Enabled Features
assert('Pro Features', 'Everything in Starter allowed', hasFeatureAccess('professional', 'pos_billing'), true);
assert('Pro Features', 'Advanced Inventory allowed', hasFeatureAccess('professional', 'advanced_inventory'), true);
assert('Pro Features', 'Customer Khata allowed', hasFeatureAccess('professional', 'customer_khata'), true);
assert('Pro Features', 'Purchase Orders allowed', hasFeatureAccess('professional', 'purchase_orders'), true);
assert('Pro Features', 'Supplier Management allowed', hasFeatureAccess('professional', 'supplier_management'), true);
assert('Pro Features', 'Expense Management allowed', hasFeatureAccess('professional', 'expense_management'), true);
assert('Pro Features', 'Advanced Analytics allowed', hasFeatureAccess('professional', 'advanced_analytics'), true);
assert('Pro Features', 'Multi-Outlet allowed', hasFeatureAccess('professional', 'multi_outlet'), true);
assert('Pro Features', 'English Language allowed', isLanguageAllowed('en', 'professional').allowed, true);
assert('Pro Features', 'Malayalam Language allowed', isLanguageAllowed('ml', 'professional').allowed, true);
assert('Pro Features', 'Arabic Language allowed', isLanguageAllowed('ar', 'professional').allowed, true);
assert('Pro Features', 'Priority Support allowed', hasFeatureAccess('professional', 'priority_support'), true);

// Pro Blocked Features
assert('Pro Restrictions', 'Centralized Fleet BLOCKED', !hasFeatureAccess('professional', 'fleet_management'), false);
assert('Pro Restrictions', 'Dedicated DB BLOCKED', !hasFeatureAccess('professional', 'dedicated_db'), false);
assert('Pro Restrictions', 'Custom Domain BLOCKED', !hasFeatureAccess('professional', 'custom_domain'), false);
assert('Pro Restrictions', 'Franchise Management BLOCKED', !hasFeatureAccess('professional', 'franchise_management'), false);
assert('Pro Restrictions', 'Enterprise API BLOCKED', !hasFeatureAccess('professional', 'enterprise_api'), false);

// Pro Resource Capacity Checks
assert('Pro Capacity', '3rd staff allowed', canAddStaff(2, 'professional').allowed, true);
assert('Pro Capacity', '4th staff BLOCKED', !canAddStaff(3, 'professional').allowed, false);
assert('Pro Capacity', '3rd outlet allowed', canAddOutlet(2, 'professional').allowed, true);
assert('Pro Capacity', '4th outlet BLOCKED', !canAddOutlet(3, 'professional').allowed, false);
assert('Pro Capacity', '6th terminal allowed', canAddTerminal(5, 'professional').allowed, true);
assert('Pro Capacity', '7th terminal BLOCKED', !canAddTerminal(6, 'professional').allowed, false);
assert('Pro Capacity', '10,000th product allowed (Unlimited)', canAddProduct(10000, 'professional').allowed, true);

// ========================================================
// 3. MULTI-CHAIN ENTERPRISE PLAN TESTS
// ========================================================
console.log('\n--- 3. Testing MULTI-CHAIN ENTERPRISE Tier (₹3,299/mo) ---');
const entLimits = DEFAULT_PLAN_LIMITS.enterprise;
assert('Enterprise Limits', 'Staff limit is strictly 5 (NOT unlimited)', entLimits.staff === 5, 5, entLimits.staff);
assert('Enterprise Limits', 'Outlet limit is Unlimited (null)', entLimits.outlets === null, null, entLimits.outlets);
assert('Enterprise Limits', 'Terminal limit is Unlimited (null)', entLimits.terminals === null, null, entLimits.terminals);
assert('Enterprise Limits', 'Product limit is Unlimited (null)', entLimits.products === null, null, entLimits.products);
assert('Enterprise Pricing', 'Monthly price is ₹3,299', PLAN_PRICING.enterprise.monthly === 3299, 3299, PLAN_PRICING.enterprise.monthly);

// Enterprise Enabled Features
assert('Enterprise Features', 'Centralized Fleet Management allowed', hasFeatureAccess('enterprise', 'fleet_management'), true);
assert('Enterprise Features', 'Enterprise Analytics allowed', hasFeatureAccess('enterprise', 'enterprise_analytics'), true);
assert('Enterprise Features', 'Dedicated Database Isolation allowed', hasFeatureAccess('enterprise', 'dedicated_db'), true);
assert('Enterprise Features', 'Custom Domain allowed', hasFeatureAccess('enterprise', 'custom_domain'), true);
assert('Enterprise Features', 'Franchise Management allowed', hasFeatureAccess('enterprise', 'franchise_management'), true);
assert('Enterprise Features', 'Enterprise API Access allowed', hasFeatureAccess('enterprise', 'enterprise_api'), true);
assert('Enterprise Features', 'Custom Integrations allowed', hasFeatureAccess('enterprise', 'custom_integrations'), true);
assert('Enterprise Features', 'English, Malayalam, Arabic allowed', isLanguageAllowed('ar', 'enterprise').allowed, true);

// Enterprise Capacity Checks
assert('Enterprise Capacity', '5th staff allowed', canAddStaff(4, 'enterprise').allowed, true);
assert('Enterprise Capacity', '6th staff BLOCKED (Strict limit 5)', !canAddStaff(5, 'enterprise').allowed, false);
assert('Enterprise Capacity', '100th outlet allowed (Unlimited)', canAddOutlet(99, 'enterprise').allowed, true);
assert('Enterprise Capacity', '500th terminal allowed (Unlimited)', canAddTerminal(499, 'enterprise').allowed, true);
assert('Enterprise Capacity', '100,000th product allowed (Unlimited)', canAddProduct(100000, 'enterprise').allowed, true);

// Summary
const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed).length;

console.log('\n========================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('========================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL PLAN RULES, CAPACITY LIMITS & PERMISSION CHECKS VERIFIED SUCCESSFULLY!\n');
}
