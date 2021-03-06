package net.dontdrinkandroot.example.angularrestspringsecurity.rest.resources;

import net.dontdrinkandroot.example.angularrestspringsecurity.JsonViews;
import net.dontdrinkandroot.example.angularrestspringsecurity.dao.newsentry.NewsEntryDao;
import net.dontdrinkandroot.example.angularrestspringsecurity.entity.NewsEntry;
import net.dontdrinkandroot.example.angularrestspringsecurity.entity.Role;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.ObjectWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.io.IOException;
import java.math.BigInteger;
import java.util.List;

@Component
@Path("/news")
public class NewsEntryResource
{
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    @Autowired
    private NewsEntryDao newsEntryDao;

    @Autowired
    private ObjectMapper mapper;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public String list() throws IOException
    {
        this.logger.info("list()");

        ObjectWriter viewWriter;
        if (this.isAdmin()) {
            viewWriter = this.mapper.writerWithView(JsonViews.Admin.class);
        } else {
            viewWriter = this.mapper.writerWithView(JsonViews.User.class);
        }
        List<NewsEntry> allEntries = this.newsEntryDao.findAll();

        return viewWriter.writeValueAsString(allEntries);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{id}")
    public NewsEntry read(@PathParam("id") Long id)
    {
        this.logger.info("read(id)");

        NewsEntry newsEntry = this.newsEntryDao.find(id);
        if (newsEntry == null) {
            throw new WebApplicationException(404);
        }
        return newsEntry;
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public NewsEntry create(NewsEntry newsEntry)
    {
        this.logger.info("create(): " + newsEntry);

        return this.newsEntryDao.save(newsEntry);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("{id}")
    public NewsEntry update(@PathParam("id") Long id, NewsEntry newsEntry)
    {
        this.logger.info("update(): " + newsEntry);

        return this.newsEntryDao.save(newsEntry);
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{id}")
    public void delete(@PathParam("id") Long id)
    {
        this.logger.info("delete(id)");

        this.newsEntryDao.delete(id);
    }

    private boolean isAdmin()
    {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();
        if ((principal instanceof String) && ((String) principal).equals("anonymousUser")) {
            return false;
        }
        UserDetails userDetails = (UserDetails) principal;

        return userDetails.getAuthorities().contains(Role.ADMIN);
    }
}
