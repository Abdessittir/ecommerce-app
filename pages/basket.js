import Head from "next/head";
import Header from "../components/home/Header";
import styles from "../styles/basket/Basket.module.css";
import {useBasket} from "../contexts/basket/BasketContext";
import BasketItem from "../components/basket/BasketItem";
import { useUser } from "../contexts/user/UserContext";
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import axios from "axios";
import { useEffect } from "react";
import { useAlert } from "../contexts/AlertContext";
import Alert from "../components/Alert";


const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function Basket(){
    const {basket, subtotal} = useBasket();
    const {user} = useUser();
    const router = useRouter();
    const {alert, setAlert} = useAlert();

    useEffect(() => {
      // Check to see if this is a redirect back from Checkout
      const query = new URLSearchParams(window.location.search);
      if (query.get('success')) {
        localStorage.removeItem('basket');
        setAlert({
          type:"success",
          message:'Order placed! You will receive an email confirmation.'
        })
      }
  
      if (query.get('canceled')) {
        setAlert({
          type:"error",
          message:'Order canceled -- continue to shop around and checkout when you’re ready.'
        })
      }
    }, []);

    async function handleCheckout(){

      if(basket.length <= 0){
        return setAlert({
          type:'error',
          message:'Cart is empty'
        })
      }
      if(!user.isLoggedIn){
        return router.push("/login");
      }
      
      try{
        const stripe = await stripePromise;
        const {data} = await axios.post("/api/checkout_sessions", {
          basket,
          address:user.info.address
        });

        const result = await stripe.redirectToCheckout({
          sessionId: data.id,
        });

      }catch(err){
        console.log(err);
      }
    }

    return (
        <>
          <Head>
            <title>amazon | basket</title>
          </Head>
          <Header />
          <main className="home" >
            <div className={styles.basket}>
              <div className={styles.basket_items}>
                <h1>{basket?.length > 0?"Shopping Cart" : "Your Amazon Cart is empty."}</h1>
                {basket.map(item => (
                  <BasketItem key={item._id} item={item} />
                ))}
              </div>
              <div className={styles.basket_subtotal}>
                <h3>Subtotal ({basket.length} items): ${subtotal()}</h3>
                <button onClick={handleCheckout}>Proceed To Checkout</button>
              </div>
            </div>
          </main>
          {alert && (
            <Alert type={alert.type} message={alert.message} />
           )}
        </>
    );
}