export type MenuItem = {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string | null;
  is_available: number | boolean;
};

export type OrderListItem = {
  id: number;
  order_number: string;
  table_id: number;
  table_number?: string | number | null;
  total_amount: number | string | null;
  order_status: string;
  payment_status: string;
  order_time: string;
};
