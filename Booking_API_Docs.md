# Booking API Documentation

This document outlines the API endpoints for managing bookings (creating, fetching, and updating) in the Puja Path Sanskar application.

---

## 1. Create a Booking (User App)

Create a new booking for a puja, choosing an address and optionally a pandit and samagri options.

- **URL:** `/api/bookings/`
- **Method:** `POST`
- **Authentication Required:** Yes (User Bearer Token)
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <user_jwt_token>`

### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `pujaId` | String (ObjectId) | **Yes** | ID of the Puja being booked. |
| `bookingDate` | String (Date) | **Yes** | Date of booking (e.g. `YYYY-MM-DD`). |
| `timeSlot` | String | **Yes** | Selected time slot (e.g. `Morning (8AM - 12PM)`). |
| `addressId` | String (ObjectId) | **Yes** | ID of the user's saved Address. |
| `panditId` | String (ObjectId) | No | Optional. ID of the specific Pandit selected. |
| `samagriOption` | String | No | Optional. Options: `"None"`, `"Basic"`, `"Premium"`. Defaults to `"None"`. |
| `specialInstructions` | String | No | Optional. Any instructions/special requirements for the pandit. |

### Pricing Calculations (Done by Backend)
- **Base Price:** Fetched from Pandit's custom price for this Puja if `panditId` is provided. Otherwise, falls back to the Puja's default `basePrice`.
- **Samagri Cost:**
  - `"None"`: +₹0
  - `"Basic"`: +₹500 ("Samagri mangwayein")
  - `"Premium"`: +₹800 ("Included Package")
- **Total Amount:** `basePrice` + `samagriCost`
- **Advance Amount:** 25% of Total Amount
- **Remaining Amount:** 75% of Total Amount

### Example Request
```json
{
  "pujaId": "6a1d38ba75669cd90a016515",
  "panditId": "6a0592e5b40d68bb2cbde580",
  "bookingDate": "2026-06-02",
  "timeSlot": "Morning (8AM - 12PM)",
  "samagriOption": "Basic",
  "addressId": "6a1e8aed17c5bbd226295a21",
  "specialInstructions": "Bring extra gangajal"
}
```

### Example Success Response (`201 Created`)
```json
{
  "success": true,
  "booking": {
    "_id": "6a1e8aee17c5bbd226295a22",
    "user": "6a1e8aed17c5bbd226295a20",
    "puja": "6a1d38ba75669cd90a016515",
    "pandit": "6a0592e5b40d68bb2cbde580",
    "bookingDate": "2026-06-02T00:00:00.000Z",
    "timeSlot": "Morning (8AM - 12PM)",
    "samagriOption": "Basic",
    "address": "Flat 101, Gokul Society, Sector 4, Rohini, New Delhi, Delhi - 110085",
    "amount": 1600,
    "originalAmount": 1600,
    "discountAmount": 0,
    "advanceAmount": 400,
    "remainingAmount": 1200,
    "status": "Pending",
    "paymentStatus": "Pending",
    "specialInstructions": "Bring extra gangajal",
    "createdAt": "2026-06-02T07:49:02.176Z",
    "updatedAt": "2026-06-02T07:49:02.176Z",
    "__v": 0
  },
  "message": "Booking created successfully"
}
```

---

## 2. Get Logged-in User's Bookings (User App)

Fetch booking history for the logged-in user.

- **URL:** `/api/bookings/my-bookings`
- **Method:** `GET`
- **Authentication Required:** Yes (User Bearer Token)
- **Headers:**
  - `Authorization: Bearer <user_jwt_token>`

### Example Success Response (`200 OK`)
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "6a1e8aee17c5bbd226295a22",
      "puja": {
        "_id": "6a1d38ba75669cd90a016515",
        "pujaType": "Satyanarayan Katha (सत्यनारायण कथा)",
        "image": "uploads/satyanarayan.jpg",
        "priceRange": "1100 - 3100"
      },
      "pandit": {
        "_id": "6a0592e5b40d68bb2cbde580",
        "fullName": "Pandit Ramesh Sharma",
        "mobileNumber": "9876543210"
      },
      "bookingDate": "2026-06-02T00:00:00.000Z",
      "timeSlot": "Morning (8AM - 12PM)",
      "samagriOption": "Basic",
      "address": "Flat 101, Gokul Society, Sector 4, Rohini, New Delhi, Delhi - 110085",
      "amount": 1600,
      "originalAmount": 1600,
      "advanceAmount": 400,
      "remainingAmount": 1200,
      "status": "Pending",
      "paymentStatus": "Pending",
      "createdAt": "2026-06-02T07:49:02.176Z"
    }
  ]
}
```

---

## 3. Get All Bookings (Admin Panel)

Fetch all bookings in the system.

- **URL:** `/api/bookings/admin/all`
- **Method:** `GET`
- **Authentication Required:** Yes (Admin Bearer Token)
- **Headers:**
  - `Authorization: Bearer <admin_jwt_token>`

### Example Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 1,
  "bookings": [
    {
      "_id": "6a1e8aee17c5bbd226295a22",
      "user": {
        "_id": "6a1e8aed17c5bbd226295a20",
        "name": "Test Booking User",
        "mobile": "9999999999"
      },
      "puja": {
        "_id": "6a1d38ba75669cd90a016515",
        "pujaType": "Satyanarayan Katha (सत्यनारायण कथा)"
      },
      "pandit": {
        "_id": "6a0592e5b40d68bb2cbde580",
        "fullName": "Pandit Ramesh Sharma",
        "mobileNumber": "9876543210"
      },
      "bookingDate": "2026-06-02T00:00:00.000Z",
      "timeSlot": "Morning (8AM - 12PM)",
      "samagriOption": "Basic",
      "address": "Flat 101, Gokul Society, Sector 4, Rohini, New Delhi, Delhi - 110085",
      "amount": 1600,
      "originalAmount": 1600,
      "advanceAmount": 400,
      "remainingAmount": 1200,
      "status": "Pending",
      "paymentStatus": "Pending",
      "createdAt": "2026-06-02T07:49:02.176Z"
    }
  ]
}
```

---

## 4. Update Booking Status / Assign Pandit (Admin Panel)

Update the status, payment details, or assign a pandit for a booking.

- **URL:** `/api/bookings/admin/:id/status`
- **Method:** `PATCH`
- **Authentication Required:** Yes (Admin Bearer Token)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_jwt_token>`

### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `status` | String | No | Options: `"Pending"`, `"Confirmed"`, `"Completed"`, `"Cancelled"`. |
| `paymentStatus` | String | No | Options: `"Pending"`, `"AdvancePaid"`, `"FullyPaid"`, `"Failed"`. |
| `panditId` | String (ObjectId) | No | ID of the Pandit to assign to the booking. |

### Example Request
```json
{
  "status": "Confirmed",
  "paymentStatus": "AdvancePaid",
  "panditId": "6a0592e5b40d68bb2cbde580"
}
```

### Example Success Response (`200 OK`)
```json
{
  "message": "Booking updated successfully",
  "success": true,
  "booking": {
    "_id": "6a1e8aee17c5bbd226295a22",
    "user": "6a1e8aed17c5bbd226295a20",
    "puja": "6a1d38ba75669cd90a016515",
    "pandit": "6a0592e5b40d68bb2cbde580",
    "bookingDate": "2026-06-02T00:00:00.000Z",
    "timeSlot": "Morning (8AM - 12PM)",
    "samagriOption": "Basic",
    "address": "Flat 101, Gokul Society, Sector 4, Rohini, New Delhi, Delhi - 110085",
    "amount": 1600,
    "originalAmount": 1600,
    "advanceAmount": 400,
    "remainingAmount": 1200,
    "status": "Confirmed",
    "paymentStatus": "AdvancePaid",
    "specialInstructions": "Bring extra gangajal",
    "createdAt": "2026-06-02T07:49:02.176Z",
    "updatedAt": "2026-06-02T07:54:10.000Z"
  }
}
```
