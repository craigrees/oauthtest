(ns showreel.handler
  (:use ring.util.response
        ring.middleware.anti-forgery)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.middleware.json :as rjson]
            [clj-http.client :as client]
            [clojure.data.json :as json]
            [ring.middleware.defaults :refer [wrap-defaults api-defaults site-defaults]]
            (ring.middleware [multipart-params :as mp])
            [compojure.core :refer [GET POST defroutes]]))

(def json-folder "tfshowreel")

(defroutes app-routes
    (GET "/admin" [] (-> (resource-response "html/index.html" {:root "public"}) (content-type "text/html")))
    (GET "/" [] (-> (resource-response "html/showreel-index.html" {:root "public"}) (content-type "text/html")))
    (GET "/showreel-posts/:bucket/:key" [bucket key]
       (let [result (client/get (str "http://" json-folder ":8098/buckets/"
                        bucket "/keys/" key))
             headers (assoc (:headers result) "Content-Length" (str (count (:body result))))
             to-return (assoc result :headers headers)]
          to-return))
    (POST "/showreel-posts/:bucket" request
        (clojure.pprint/pprint request)
        (client/post (str "http://" json-folder ":8098/buckets/"
                          (:bucket (:params request)))
                     {:body (json/write-str (:body request))
                      :content-type :json}))
    (mp/wrap-multipart-params
        (POST "/showreel-image/:bucket/:key" {params :params request :request mp-params :multipart-params}
            (clojure.pprint/pprint params)
            (clojure.pprint/pprint request)
            (client/post (str "http://" json-folder ":8098/buckets/"
                         (:bucket params)
                         "/keys/" (:key params))
                     {:body (clojure.java.io/file (:tempfile(get params "file")))
                     :body-encoding "UTF-8"
                     :content-type (:content-type(get params "file"))})))
    (PUT "/showreel-posts/:bucket/:key" request
       (clojure.pprint/pprint request)
       (client/put (str "http://" json-folder ":8098/buckets/"
                        (:bucket (:params request))
                        "/keys/" (:key (:params request)))
                   {:body (json/write-str (:body request))
                    :content-type :json}))
    (DELETE "/showreel-posts/:bucket/:key" request
       (client/delete (str "http://" json-folder ":8098/buckets/"
                           (:bucket (:params request))
                           "/keys/" (:key (:params request)))))
    (route/resources "/" {:root "public"})
    (route/not-found "Not Found"))

(defroutes app-non-json-routes
    (GET "/showreel-image/:bucket/:key" [bucket key]
       (let [result (client/get (str "http://" json-folder ":8098/buckets/"
                        bucket "/keys/" key)
                        {:as :byte-array})
             record (:body result)]
          (-> (response (java.io.ByteArrayInputStream. record))
              (content-type (:content-type "image/jpeg"))
              (header "Content-Length" (count record))))))

(def app
  (wrap-defaults
     (routes app-non-json-routes
            (rjson/wrap-json-body app-routes))
            api-defaults))
