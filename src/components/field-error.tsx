/** An inline field message, referenced from the input by `id` through aria-describedby. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p className="form-error" id={id}>{message}</p> : null;
}
