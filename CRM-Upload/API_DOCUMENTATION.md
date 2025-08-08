# CRM Backend API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
All endpoints (except auth) require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Customers
- `GET /customers` - Get all customers
- `GET /customers/:id` - Get customer by ID
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `GET /customers/:id/contacts` - Get customer's contacts
- `GET /customers/:id/leads` - Get customer's leads

### Leads
- `GET /leads` - Get all leads with customer details
- `GET /leads/:id` - Get lead by ID
- `POST /leads` - Create new lead
- `PUT /leads/:id` - Update lead
- `DELETE /leads/:id` - Delete lead

### Contacts
- `GET /contacts` - Get all contacts
- `GET /contacts/:id` - Get contact by ID
- `GET /contacts/customer/:customer_id` - Get contacts by customer
- `GET /contacts/type/:type` - Get contacts by type (email, phone, etc.)
- `POST /contacts` - Create new contact
- `PUT /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact

### Stages
- `GET /stages` - Get all stages
- `POST /stages` - Create new stage
- `PUT /stages/:id` - Update stage
- `DELETE /stages/:id` - Delete stage

## Request/Response Examples

### Create Customer
```json
POST /customers
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "ABC Corp",
  "address": "123 Main St"
}
```

### Create Lead
```json
POST /leads
{
  "customer_id": 1,
  "lead_source": "Website",
  "status": "new",
  "value": 5000,
  "description": "Interested in our services"
}
```

### Create Contact
```json
POST /contacts
{
  "customer_id": 1,
  "contact_type": "email",
  "contact_value": "john.work@example.com",
  "is_primary": false
}
```

## Validation Rules

### Email Validation
- Must be valid email format
- Cannot contain only numbers
- Cannot contain only alphabets
- Must include @ and domain

### Phone Validation
- Accepts various formats: +1234567890, (123) 456-7890, 123-456-7890
- Must be valid phone number format

### Required Fields
- Customer: name, email, phone
- Lead: customer_id, lead_source, status
- Contact: customer_id, contact_type, contact_value

## Error Responses
All errors return JSON with:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Success Responses
All successful operations return:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```