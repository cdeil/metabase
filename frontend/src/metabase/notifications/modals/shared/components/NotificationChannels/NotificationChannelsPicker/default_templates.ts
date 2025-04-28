const HIDE_THE_BLANKS = {
  name: "Hide the blanks",
  description:
    "Loop every field but suppress null/empty, so emails stay concise regardless of table width.",
  body: `<ul style="font-family:Arial, sans-serif;">
  {{#each records.[0].row}}
    {{#unless (or (eq this \"\") (eq this null))}}
      <li><strong>{{@key}}:</strong> {{this}}</li>
    {{/unless}}
  {{/each}}
</ul>`,
};

const CONDITIONAL_SPOTLIGHT = {
  name: "Conditional spotlight",
  description:
    "Raise the volume only when any field matches a rule you pass in — the template itself stays generic.",
  body: `{{#if records.[0].row.is_critical}}
  <h2 style="color:#b00;font-family:Arial;"> Critical row created!</h2>
{{else}}
  <h3 style="font-family:Arial;">New row created</h3>
{{/if}}

<ul>
  {{#each records.[0].row}}
    <li>{{@key}}: {{this}}</li>
  {{/each}}
</ul>`,
};

const REGULAR_NOTIFICATION = {
  name: "Regular alert",
  description:
    "Show all fields, so emails stay concise regardless of table width.",
  body: `<ul style="font-family:Arial, sans-serif;">
  {{#each records.[0].row}}
    <li><strong>{{@key}}:</strong> {{this}}</li>
  {{/each}}
</ul>`,
};

export const DEFAULT_TEMPLATES = [
  HIDE_THE_BLANKS,
  CONDITIONAL_SPOTLIGHT,
  REGULAR_NOTIFICATION,
];
