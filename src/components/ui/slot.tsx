import * as React from "react";

type AnyProps = Record<string, unknown>;

function setRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

/**
 * Renders its only child with these props merged in, for `asChild`: the
 * child's handlers run before the slot's, class names and styles combine,
 * and both refs get the node. The same merge as Radix's `Slot`, without the
 * `radix-ui` package.
 */
export function Slot({
  children,
  ref,
  ...slotProps
}: React.HTMLAttributes<HTMLElement> & {
  ref?: React.Ref<HTMLElement>;
  children?: React.ReactNode;
}) {
  if (!React.isValidElement<AnyProps>(children)) return null;
  const childProps = children.props;
  const merged: AnyProps = { ...slotProps, ...childProps };

  for (const name in childProps) {
    const slotValue = (slotProps as AnyProps)[name];
    const childValue = childProps[name];
    if (/^on[A-Z]/.test(name)) {
      if (typeof slotValue === "function" && typeof childValue === "function") {
        merged[name] = (...args: unknown[]) => {
          const result = childValue(...args);
          slotValue(...args);
          return result;
        };
      } else if (slotValue) {
        merged[name] = slotValue;
      }
    } else if (name === "style") {
      merged.style = { ...(slotValue as object), ...(childValue as object) };
    } else if (name === "className") {
      merged.className = [slotValue, childValue].filter(Boolean).join(" ");
    }
  }

  const childRef = childProps.ref as React.Ref<HTMLElement> | undefined;
  merged.ref =
    ref && childRef
      ? (node: HTMLElement | null) => {
          setRef(ref, node);
          setRef(childRef, node);
        }
      : (ref ?? childRef);

  return React.cloneElement(children, merged);
}
