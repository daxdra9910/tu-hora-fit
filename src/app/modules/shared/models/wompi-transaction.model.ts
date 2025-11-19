/** Respuesta de Wompi al crear una transacción */
export interface WompiTransactionResponse {
  data: {
    id: string;
    created_at: string;
    finalized_at?: string;
    amount_in_cents: number;
    reference: string;
    customer_email: string;
    currency: string;
    payment_method_type: 'CARD' | 'NEQUI' | 'BANCOLOMBIA_TRANSFER' | 'PSE';
    payment_method?: {
      type: string;
      extra?: any;
    };
    status:
      | 'PENDING'      // Pendiente
      | 'APPROVED'     // Aprobado
      | 'DECLINED'     // Rechazado
      | 'VOIDED'       // Anulado
      | 'ERROR';       // Error
    status_message?: string;
    shipping_address?: any;
    payment_link_id?: string;
    payment_source_id?: number;
    payment_source_name?: string;
    customer_data?: {
      full_name: string;
      phone_number: string;
      legal_id?: string;
    };
  };
  meta?: {
    platform_id: number;
    unique_code: string;
    version: string;
  };
}

/** Request para crear transacción en Wompi */
export interface WompiTransactionRequest {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_method: {
    type: 'CARD' | 'NEQUI' | 'BANCOLOMBIA_TRANSFER' | 'PSE';
    token: string;
    installments: number;
  };
  reference: string;
  customer_data?: {
    phone_number: string;
    full_name: string;
    legal_id?: string;
  };
  payment_source_id?: number;
  redirect_url?: string;
}

/** Respuesta de Wompi para generar token de tarjeta */
export interface WompiTokenResponse {
  data: {
    id: string;
    created_at: string;
    brand: string;
    name: string;
    last_four: string;
    bin: string;
    exp_year: string;
    exp_month: string;
    card_holder: string;
    expires_at: string;
    validity_ends_at: string;
  };
}

/** Datos de la tarjeta para tokenización */
export interface WompiCardData {
  number: string;        // Número de tarjeta
  cvc: string;          // Código de seguridad
  exp_month: string;    // Mes expiración (01-12)
  exp_year: string;     // Año expiración (YYYY)
  card_holder: string;  // Nombre en tarjeta
}

/** Webhook de Wompi */
export interface WompiWebhookPayload {
  event: 'transaction.updated';
  data: {
    transaction: {
      id: string;
      status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
      reference: string;
      amount_in_cents: number;
      currency: string;
      customer_email: string;
      payment_method_type: string;
      finalized_at: string;
    };
  };
  sent_at: string;
  signature: {
    properties: string[];
    checksum: string;
  };
}
