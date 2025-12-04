import { shippingAggregatorClient } from "@/lib/services/shipping-aggregator";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Updated payload based on the documentation you provided
  const testPayload = {
    order_id: "", 
    pickup_pincode: 110001,
    delivery_pincode: 226001,
    payment_type: "COD",
    shipment_type: "FORWARD", // Required field
    order_amount: 500,        // Required (was invoice_value)
    type_of_package: "SPS",   // Required (Standard Package Service)
    rov_type: "ROV_OWNER",    // Required (Responsibility of Value)
    cod_amount: "500",        // Docs say string for COD amount
    weight: 500,              // Docs say GRAMS (0.5kg = 500g)
    dimensions: [             // Docs require an array of objects
      {
        no_of_box: "1",
        length: "10",
        width: "10",
        height: "10"
      }
    ]
  };

  const result = await shippingAggregatorClient.getRates(testPayload);

  return NextResponse.json({ 
    message: "Check your VS Code terminal for the logs!", 
    apiResult: result 
  });
}