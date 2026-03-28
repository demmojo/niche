# Multi-Product and Team Capabilities

This feature introduces multi-product management and team collaboration, with distinct experiences for superadmins and normal users to drive feature discovery and upgrades.

## Features

### 1. Multi-Product Dropdown

- **Requirement:** The existing product dropdown in the top navigation must include a "+ Add New Product" option.
- **Requirement:** For superadmins, clicking "+ Add New Product" opens a flow/modal to create a new product.
- **Requirement:** For normal users, the "+ Add New Product" option appears disabled or visually distinct.
- **Requirement:** For normal users, clicking the disabled "+ Add New Product" option opens an "Upgrade / Request Access" modal.

### 2. Team Settings

- **Requirement:** A new "Team" tab is added to the Settings area.
- **Requirement:** For superadmins, the Team tab displays current team members and provides an interface to invite new users via email.
- **Requirement:** For normal users, the Team tab is visible but its interactive elements (invite form, member management) are disabled.
- **Requirement:** For normal users, the Team tab includes a prominent button to "Request Access" which opens the upgrade modal.

## Scenarios

- **WHEN** a superadmin clicks "+ Add New Product" in the top nav
- **THEN** they are presented with the UI to create a new product.

- **WHEN** a normal user clicks "+ Add New Product" in the top nav
- **THEN** an upgrade/request access modal is displayed.

- **WHEN** a superadmin navigates to the Team settings tab
- **THEN** they can view team members and send email invitations.

- **WHEN** a normal user navigates to the Team settings tab
- **THEN** they see disabled team management UI and a "Request Access" button.
