import { useEffect, useRef } from "react";

interface Props {
  id: string;
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  className?: string;
}

export default function TriStateCheckbox({ id, checked, indeterminate, onChange, className }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className={className ?? "pago-checkbox"}
      checked={checked}
      onChange={onChange}
    />
  );
}
