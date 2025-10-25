import { Footer } from "~~/components/Footer";

type Props = React.PropsWithChildren & Record<string, unknown>;

export default (({ children }) => {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}) as React.FC<Props>;
