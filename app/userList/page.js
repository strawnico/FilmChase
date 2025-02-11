"use client";

import { useEffect, useState } from "react";
import FilmCard from "../../components/FilmCard.js";
import LateralMenu from "../../components/LateralMenu.js";
import { Search, AccountCircle, FilterList } from "@material-ui/icons";
import TopMenu from "@/components/TopMenu.js";
import Modal from "@/components/Modal.js";
import Loading from "@/components/Loading.js";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/auth/firebase.js";

export default function UserList() {
  const [films, setFilms] = useState([]);
  const [correctFilms, setCorrectFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFilmDetails, setOpenFilmDetails] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState({});
  const [search, setSearch] = useState("");

  const getFilm = async () => {
    try {
      const filmPromises = films?.map(async (film) => {
        const url = `https://api.themoviedb.org/3/movie/${film}?language=pt-BR`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNzUxM2VhMDAxZDUyMTNkYjExMWQ4OTI5M2E0YjIyNCIsInN1YiI6IjY0NWNmZDFlMWI3MGFlMDBmZDZkNWUwNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.MZUoMEgF3X1GkXtbYo8Y4kxSyQuNYBlL6f28bUM23Rk",
          },
        });
        const filmData = await response.json();
        return { ...film, ...filmData };
      });

      const updatedFilms = await Promise.all(filmPromises);

      const filteredFilms = updatedFilms.filter((film) =>
        film.title.toLowerCase()?.includes(search.toLowerCase())
      );

      setCorrectFilms(filteredFilms);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  }

  const addFilm = async (filmId) => {
    try {
      const uid = localStorage.getItem("uid");
      const q = query(collection(db, "users"), where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        const likedFilms = doc.data().likedFilms || [];
        if (likedFilms?.includes(filmId)) {
          await updateDoc(doc.ref, {
            likedFilms: arrayRemove(filmId),
          });
        } else {
          await updateDoc(doc.ref, {
            likedFilms: arrayUnion(filmId),
          });
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const removeFilm = async (filmId) => {
    try {
      const uid = localStorage.getItem("uid");
      const q = query(collection(db, "users"), where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        const listFilms = doc.data().listFilms || [];
        const userRef = doc.ref;

        if (listFilms?.includes(filmId)) {
          await updateDoc(userRef, {
            listFilms: arrayRemove(filmId),
          });
        } else {
          await updateDoc(userRef, {
            listFilms: arrayUnion(filmId),
          });
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const uid = localStorage.getItem("uid");
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let listFilms = [];
      snapshot.forEach((doc) => {
        listFilms = doc.data().listFilms;
      });
      setFilms(listFilms);
    });
  }, []);

  useEffect(() => {
    getFilm();
  }, [search, films]);

  return (
    <main className="font-mont w-screen h-screen bg-[#161616] flex">
      <LateralMenu userList={true}></LateralMenu>
      <div className="flex flex-col h-screen w-full p-6">
        <TopMenu userList={true}></TopMenu>
        {films?.length == 0 ? (
          false
        ) : (
          <div className="flex w-full h-fit">
            <div className="flex items-center gap-2 w-full p-4 h-12 border-[#252525] border rounded-md hover:border-[#757575] transition-all">
              <Search className="text-[#A1A1A1]"></Search>
              <input
                className="font-mont bg-transparent w-full focus:outline-none text-white"
                placeholder="Buscar por nome do filme"
                onChange={(e) => setSearch(e.target.value)}
              ></input>
            </div>
            <div className="h-12 w-12 flex items-center justify-center">
              <AccountCircle className="text-[#A1A1A1]"></AccountCircle>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col w-full h-full items-center justify-center gap-2">
            <p className="text-[#A1A1A1] text-2xl">Carregando...</p>
            <Loading></Loading>
          </div>
        ) : (
          <div className="flex w-full h-full mt-4 overflow-y-auto flex-col">
            {films?.length === 0 ? (
              <div className="flex flex-col w-full h-full items-center justify-center gap-2">
                <p className="text-[#A1A1A1] text-2xl text-center w-full mt-10">
                  Nenhum filme encontrado
                </p>
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {correctFilms?.map((film) => {
                  return (
                    <FilmCard
                      key={film.id}
                      title={film.title}
                      image={film.poster_path}
                      rate={film.vote_average}
                      id={film.id}
                      onVisibilityClick={() => {
                        setOpenFilmDetails(true);
                        setSelectedFilm(film);
                      }}
                      onLikeClick={() => {
                        addFilm(film.id);
                      }}
                      onListClick={() => {
                        removeFilm(film.id);
                      }}
                    ></FilmCard>
                  );
                })}
                {openFilmDetails ? (
                  <Modal
                    id={selectedFilm.id}
                    onVisibilityClick={() => {
                      setOpenFilmDetails(false);
                    }}
                  />
                ) : (
                  false
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
