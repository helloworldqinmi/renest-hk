import styles from './brand-logo.module.css';
export function BrandLogo({compact=false}:{compact?:boolean}){
 return <span className={`${styles.root} ${compact?styles.compact:''}`} aria-label="ReNest — The Moving Studio"><svg className={styles.mark} viewBox="0 0 34 40" fill="none" aria-hidden="true"><path d="M4.5 16.2 15.6 6.8a2.2 2.2 0 0 1 2.8 0l11.1 9.4a3.4 3.4 0 0 1 1.2 2.6V33a2.5 2.5 0 0 1-2.5 2.5H5.8A2.5 2.5 0 0 1 3.3 33V18.8c0-1 .4-1.9 1.2-2.6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12.6 35.5V24.7a1.8 1.8 0 0 1 1.8-1.8h5.2a1.8 1.8 0 0 1 1.8 1.8v10.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg><span className={styles.wordmark}>ReNest<span className={styles.tagline}>THE MOVING STUDIO</span></span></span>;
}
