"""Fix hardcoded KPI values in admin/index.html template."""
import re

with open('templates/admin/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Simple string replacements for hardcoded KPI values
content = content.replace(
    '>1,284</div>',
    '>{{ total_students|default:"0" }}</div>',
    1  # only first occurrence
)
content = content.replace(
    '>+12.4% this month</div>',
    '>+{{ student_growth|default:"0" }}% this month</div>'
)
content = content.replace(
    '>142</div>',
    '>{{ total_applicants|default:"0" }}</div>',
    1
)
content = content.replace(
    '>38</div>',
    '>{{ total_teachers|default:"0" }}</div>',
    1
)
content = content.replace(
    '>24</div>',
    '>{{ total_staff|default:"0" }}</div>',
    1
)
content = content.replace(
    '>5</div>\r\n        <div class="text-xs text-slate-500 mt-1">4 physical + 1 virtual',
    '>{{ total_campuses|default:"0" }}</div>\r\n        <div class="text-xs text-slate-500 mt-1">Registered locations'
)
content = content.replace(
    '>14</div>',
    '>{{ total_programs|default:"0" }}</div>',
    1
)
content = content.replace(
    '>KES 485.0K</div>',
    '>KES {{ revenue_today|default:"0" }}</div>'
)
content = content.replace(
    '>+8.4% vs daily avg</div>',
    '>Live daily total</div>'
)
content = content.replace(
    '>KES 2.45M</div>',
    '>{{ total_receipts|default:"0" }} receipts</div>'
)
content = content.replace(
    '>Across 340 active students</div>',
    '>Total receipt records</div>'
)
content = content.replace(
    '>1,890</div>',
    '>{{ total_certificates|default:"0" }}</div>',
    1
)
content = content.replace(
    '>FY 2025/2026 ledger</div>',
    '>Verified certificates</div>'
)
content = content.replace(
    '>450</div>',
    '>{{ attendance_rate|default:"0" }}%</div>',
    1
)
content = content.replace(
    '>Goethe & Horizon verified</div>',
    '>Weekly avg attendance</div>'
)

# Also update the 1,284 Active reference in the chart heading
content = content.replace(
    '>1,284 Active</span>',
    '>{{ total_students|default:"0" }} Active</span>'
)

with open('templates/admin/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done: replaced all hardcoded KPIs with Django template variables')
