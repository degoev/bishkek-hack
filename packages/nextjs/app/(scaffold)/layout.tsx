import { Footer } from "~~/components/Footer";

type Props = React.PropsWithChildren;

export default (({ children }) => {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}) as React.FC<Props>;
