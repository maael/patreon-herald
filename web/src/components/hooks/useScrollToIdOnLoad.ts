import { useRouter } from "next/router";
import { useLayoutEffect, useState } from "react";
import {useIsFetching} from 'react-query'

export default function useScrollToIdOnLoad(membersLoaded: boolean) {
  const {query} = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const isFetching = useIsFetching();
  useLayoutEffect(() => {
    if (query?.p && !scrolled) {
      const item = document.body.querySelector(`#pledge-${query?.p}`)
      if (item){
        item.scrollIntoView()
        setScrolled(true)      
      }}
  }, [query?.p, scrolled, isFetching, membersLoaded])
}