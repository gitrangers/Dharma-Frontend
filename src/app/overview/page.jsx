import Image from "next/image";

export const metadata = {
  title: "Overview — Dharma Productions",
  description:
    "About Dharma Productions — heart-warming storylines, stellar casts, and Karan Johar.",
};

export default function OverviewPage() {
  return (
    <section className="overview-page">
      <div className="abt-banner">
        <div className="container overview-page__container">
          <div className="row">
            <div className="col-md-12">
              <div className="head-title text-center top-pad-abt">
                <h1 className="color-white f120 text-up font-hammersmith">
                  about us
                </h1>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div className="main-about-sec">
                <div className="movie-inside-curve" id="top-scroll" />
                <div className="movie-inner-bg">
                  <div className="m-min-tp">
                    <div className="text-center pt20 overview-taglines">
                      <h1 className="color-primary font-bold text-up margin0">
                        Heart-warming storylines...
                      </h1>
                      <h1 className="color-primary font-bold text-up margin0">
                        Stellar megastar casts...
                      </h1>
                      <h1 className="color-primary font-bold text-up margin0">
                        Record box-office collections...
                      </h1>
                    </div>
                    <div className="data-abt mt20 movie-inside-date pb30">
                      <p>
                        Dharma Productions is one of India&apos;s top film
                        production house. Led by Karan Johar, the company was
                        founded by his father Late Shri Yash Johar in 1976, with
                        its first production venture titled &apos;Dostana&apos;
                        starring Amitabh Bachchan. Since Karan Johar&apos;s
                        directorial debut film &apos;Kuch Kuch Hota Hai&apos;,
                        the company has gone on to produce more than 45 films
                        which include a series of blockbusters and critically
                        acclaimed films like &apos;Kabhi Khushi Kabhie Gham,
                        Yeh Jawaani Hai Deewani, 2 States, Kapoor & Sons and
                        Dear Zindagi&apos;. In its recent past, Dharma
                        Productions has earned a name in the industry for
                        encouraging and launching a fresh talent pool of
                        directors, together with rising stars such as Alia Bhatt,
                        Sidharth Malhotra and Varun Dhawan. In the last few
                        years, the company produced both critical & commercial
                        successes alike Raazi, Dhadak, Simmba, Kesari & Good
                        Newwz, Shershaah, Sooryavanshi, JugJugg Jeeyo,
                        Brahmastra. Some of the most keenly awaited films sitting
                        in its roster are Rocky Aur Rani Ki Prem Kahani, Yodha,
                        Mr. & Mrs. Mahi and more. Today, Dharma Productions is the
                        most sought after production house in the country and is
                        constantly aiming at creating new benchmarks in the
                        Indian film industry.
                      </p>
                    </div>
                    <div className="karan-img dh-relative pb30">
                      <Image
                        src="/frontend/img/m1.jpg"
                        alt="Dharma Productions"
                        width={1511}
                        height={797}
                        className="img-responsive"
                        sizes="(max-width: 768px) 100vw, 1140px"
                      />
                      <div className="movie-inside-date top-min">
                        <div className="mn-org">
                          <div className="text-center">
                            <h1 className="margin0 font-bold color-white">
                              KARAN JOHAR
                            </h1>
                            <h4 className="margin0 font-bold color-white text-up">
                              many hats, one head.
                            </h4>
                          </div>
                          <p className="color-white f18 mt15 f14-min">
                            Producer, Director &amp; Talk show host, Karan
                            Johar is one of the most notable Indian Filmmakers,
                            who has brought a fresh &amp; modern outlook to
                            Indian Commercial Cinema.
                          </p>
                        </div>
                        <p className="mt20">
                          Karan Johar made his directorial debut at age 25 with a
                          path-breaking love story &apos;Kuch Kuch Hota
                          Hai&apos;. The film remains a landmark in Indian
                          Cinema for the appreciation it received, both critically
                          and commercially, in India as well as the world.
                          Following this, over the last 15 years, he has directed
                          and written critically and commercially acclaimed
                          blockbusters like Kabhi Khushi Kabhie Gham, Kabhi Alvida
                          Naa Kehna and My Name Is Khan.
                        </p>
                        <p>
                          The multi-faceted Karan wears many caps with ease.
                          Besides being an acclaimed director and one of the most
                          influential men in the industry today, Karan is also a
                          television personality, a talk show host, a costume
                          designer and the latest feather in his cap is that of
                          being an actor. His talk show Koffee With Karan has the
                          distinction of being the most watched English talk show
                          on Indian television.
                        </p>
                        <p>
                          In addition to personal success and accomplishment, Karan
                          Johar has also been a mentor to many successful
                          directors in India. Directors have flourished under his
                          guidance and support as a producer, releasing both
                          commercial blockbusters like Agneepath, Dostana and Yeh
                          Jawaani Hai Deewani, as well as critical indie successes
                          like Wake Up Sid and Ek Main Aur Ekk Tu.
                        </p>
                        <p>
                          The name Karan Johar is synonymous with prestige,
                          elegance, versatility and success. He is amongst a
                          prolific group of Indian film makers who have brought
                          about a fresh and modern outlook to Indian commercial
                          cinema and has contributed greatly to the transformation
                          of Hindi cinema from his very first film.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
