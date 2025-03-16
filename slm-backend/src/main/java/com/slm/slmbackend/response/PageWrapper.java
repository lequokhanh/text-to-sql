package com.slm.slmbackend.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Getter
@Setter
@Accessors(chain = true)
@NoArgsConstructor
public class PageWrapper<T> {

    private long totalItems;
    private long totalPages;
    private int page;
    private int size;
    private List<T> content;

    public static <T> PageWrapper<T> of(Page<T> page) {
        PageWrapper<T> pageWrapper = new PageWrapper<T>()
                .setContent(page.getContent())
                .setTotalItems(page.getTotalElements())
                .setTotalPages(page.getTotalPages());

        return page.getPageable() == Pageable.unpaged()
                ? pageWrapper
                : pageWrapper
                .setPage(page.getPageable().getPageNumber())
                .setSize(page.getPageable().getPageSize());
    }

}