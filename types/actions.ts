/**
 * Standard ActionResult convention for all Next.js Server Actions in Outbound Engine.
 */
export type ActionResult<T = void> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      code?: string;
    };
